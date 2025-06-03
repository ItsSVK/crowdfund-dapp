use anchor_lang::prelude::*;

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
