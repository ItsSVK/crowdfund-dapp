/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://crowdfund.itssvk.dev',
  generateRobotsTxt: true, // (optional)
  generateIndexSitemap: false, // Since you probably won't have more than 50k pages
  exclude: [
    '/server-sitemap-index.xml', // Exclude server sitemap
    '/api/*', // Exclude API routes
    '/_*', // Exclude Next.js internal pages
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/admin/'],
      },
    ],
    additionalSitemaps: ['https://crowdfund.itssvk.dev/sitemap.xml'],
  },
  // Add any additional pages you want to include
  additionalPaths: async config => {
    const result = [];

    // Add any dynamic routes or specific pages here
    // For example, if you have campaign detail pages:
    // result.push({
    //   loc: '/campaigns/some-campaign-id',
    //   lastmod: new Date().toISOString(),
    //   priority: 0.8,
    //   changefreq: 'weekly'
    // });

    return result;
  },
  // Configure priorities and change frequencies
  transform: async (config, path) => {
    // Set custom priorities for different page types
    if (path === '/') {
      return {
        loc: path,
        lastmod: new Date().toISOString(),
        priority: 1.0,
        changefreq: 'daily',
      };
    }

    if (path === '/app') {
      return {
        loc: path,
        lastmod: new Date().toISOString(),
        priority: 0.9,
        changefreq: 'daily',
      };
    }

    // Default transform
    return {
      loc: path,
      lastmod: new Date().toISOString(),
      priority: 0.7,
      changefreq: 'weekly',
    };
  },
};
