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
        target_amount: Option<u64>,
        deadline: Option<i64>,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        campaign.name = name;
        campaign.description = description;
        campaign.owner = *ctx.accounts.owner.key;
        campaign.target_amount = target_amount;
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
    pub target_amount: Option<u64>,
    pub deadline: Option<i64>,
    pub total_amount_donated: u64,
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
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum CustomError {
    #[msg("The campaign has ended.")]
    CampaignEnded,
    #[msg("Overflow in donation amount.")]
    Overflow,
}
