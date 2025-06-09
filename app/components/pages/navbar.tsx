'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { CustomWalletButton } from './CustomWalletButton';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="z-50 border-b bg-background/80 backdrop-blur-md sticky top-0"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <Logo
              className="h-8 w-8"
              showText={true}
              onClick={() => router.push('/')}
            />
            {/* <h1
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
              onClick={() => router.push('/')}
            >
              CrowdSOL
            </h1> */}
          </motion.div>

          {pathname === '/' && (
            <nav className="hidden md:flex items-center space-x-8">
              {['Features', 'How it Works'].map((item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  initial={{ opacity: 0, y: -10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  {item}
                </motion.a>
              ))}
            </nav>
          )}

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {pathname === '/' ? (
              <Link href="/app">
                <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white cursor-pointer">
                  Launch App
                </Button>
              </Link>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <CustomWalletButton />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
