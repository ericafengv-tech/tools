const withMDX = require('@next/mdx')();

const isGithubPages = process.env.GITHUB_ACTIONS === 'true';
const repoName = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
    pageExtensions: ['ts', 'tsx', 'mdx'],
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    output: 'export',
    basePath: isGithubPages ? repoName : '',
    assetPrefix: isGithubPages ? repoName : '',
    images: {
        unoptimized: true,
    },
    trailingSlash: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

module.exports = withMDX(nextConfig);
