use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

declare_id!("BHxtP7TuM13v1PBSoDN8gWap7acf4bnVQjxNFEs9ipbR");

#[program]
pub mod crowdfund {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn create_campaign(
        ctx: Context<CreateCampaign>,
        name: String,
        description: String,
        goal: u64,
        deadline: Option<i64>,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        campaign.name = name;
        campaign.description = description;
        campaign.owner = *ctx.accounts.owner.key;
        campaign.goal = goal;
        campaign.deadline = deadline;
        campaign.total_amount_donated = 0;
        Ok(())
    }

    pub fn donate_to_campaign(
        ctx: Context<DonateToCampaign>,
        amount: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        // Check deadline
        if let Some(deadline) = ctx.accounts.campaign.deadline {
            require!(clock.unix_timestamp < deadline, CustomError::CampaignEnded);
        }
        // Transfer lamports from contributor to campaign
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.contributor.to_account_info(),
                to: ctx.accounts.campaign.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, amount)?;
        // Now take mutable borrow and update state
        let campaign = &mut ctx.accounts.campaign;
        campaign.total_amount_donated = campaign
            .total_amount_donated
            .checked_add(amount)
            .ok_or(CustomError::Overflow)?;
        // Update or initialize contributor record
        let contributor_record = &mut ctx.accounts.contributor_record;
        if contributor_record.amount_donated == 0 {
            contributor_record.campaign = campaign.key();
            contributor_record.contributor = ctx.accounts.contributor.key();
        }
        contributor_record.amount_donated = contributor_record
            .amount_donated
            .checked_add(amount)
            .ok_or(CustomError::Overflow)?;
        contributor_record.withdrawn = false;
        Ok(())
    }

    pub fn withdraw_if_failed(ctx: Context<WithdrawIfFailed>) -> Result<()> {
        let campaign = &ctx.accounts.campaign;
        let contributor_record = &mut ctx.accounts.contributor_record;
        let clock = Clock::get()?;
        // Check deadline
        require!(
            campaign.deadline.is_some() && clock.unix_timestamp >= campaign.deadline.unwrap(),
            CustomError::CampaignStillActive
        );
        // Check if goal was NOT reached
        require!(
            campaign.total_amount_donated < campaign.goal,
            CustomError::CampaignGoalReached
        );
        // Check if already withdrawn
        require!(!contributor_record.withdrawn, CustomError::AlreadyWithdrawn);
        // Check if contributor has something to withdraw
        require!(contributor_record.amount_donated > 0, CustomError::NothingToWithdraw);
        // Transfer lamports from campaign to contributor
        **ctx.accounts.campaign.to_account_info().try_borrow_mut_lamports()? -= contributor_record.amount_donated;
        **ctx.accounts.contributor.to_account_info().try_borrow_mut_lamports()? += contributor_record.amount_donated;
        // Mark as withdrawn
        contributor_record.withdrawn = true;
        Ok(())
    }

    pub fn withdraw_by_owner(ctx: Context<WithdrawByOwner>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let clock = Clock::get()?;
        // Check deadline
        require!(
            campaign.deadline.is_some() && clock.unix_timestamp >= campaign.deadline.unwrap(),
            CustomError::CampaignStillActive
        );
        // Check if goal was reached
        require!(
            campaign.total_amount_donated >= campaign.goal,
            CustomError::CampaignGoalNotReached
        );
        // Check if already withdrawn
        require!(!campaign.withdrawn_by_owner, CustomError::AlreadyWithdrawnByOwner);
        // Transfer lamports from campaign to owner
        let amount = campaign.total_amount_donated;
        **campaign.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.owner.try_borrow_mut_lamports()? += amount;
        // Mark as withdrawn
        campaign.withdrawn_by_owner = true;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[account]
#[derive(InitSpace)]
pub struct Campaign {
    #[max_len(32)]
    pub name: String,
    #[max_len(256)]
    pub description: String,
    pub owner: Pubkey,
    pub goal: u64,
    pub deadline: Option<i64>,
    pub total_amount_donated: u64,
    pub withdrawn_by_owner: bool,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateCampaign<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Campaign::INIT_SPACE,
        seeds = [b"campaign", owner.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DonateToCampaign<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub contributor: Signer<'info>,
    #[account(
        init_if_needed,
        payer = contributor,
        space = 8 + ContributorRecord::INIT_SPACE,
        seeds = [b"contributor", campaign.key().as_ref(), contributor.key().as_ref()],
        bump
    )]
    pub contributor_record: Account<'info, ContributorRecord>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct ContributorRecord {
    pub campaign: Pubkey,
    pub contributor: Pubkey,
    pub amount_donated: u64,
    pub withdrawn: bool,
}

#[derive(Accounts)]
pub struct WithdrawIfFailed<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut, has_one = campaign, has_one = contributor)]
    pub contributor_record: Account<'info, ContributorRecord>,
    #[account(mut)]
    pub contributor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawByOwner<'info> {
    #[account(mut, has_one = owner)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

impl ContributorRecord {
    pub const INIT_SPACE: usize = 8 + 32 + 32 + 8 + 1;
}

#[error_code]
pub enum CustomError {
    #[msg("The campaign has ended.")]
    CampaignEnded,
    #[msg("Overflow in donation amount.")]
    Overflow,
    #[msg("The campaign is still active.")]
    CampaignStillActive,
    #[msg("The campaign goal was reached.")]
    CampaignGoalReached,
    #[msg("Already withdrawn.")]
    AlreadyWithdrawn,
    #[msg("Nothing to withdraw.")]
    NothingToWithdraw,
    #[msg("The campaign goal was not reached.")]
    CampaignGoalNotReached,
    #[msg("Owner has already withdrawn.")]
    AlreadyWithdrawnByOwner,
}
