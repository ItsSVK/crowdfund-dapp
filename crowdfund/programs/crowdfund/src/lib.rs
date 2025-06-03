use anchor_lang::prelude::*;

declare_id!("BHxtP7TuM13v1PBSoDN8gWap7acf4bnVQjxNFEs9ipbR");

#[program]
pub mod crowdfund {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
