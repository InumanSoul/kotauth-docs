// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';

// https://astro.build/config
export default defineConfig({
	integrations: [
		mermaid(),
		starlight({
			plugins: [],
			title: 'Kotauth',
			description: 'Identity infrastructure for modern applications. Self-hosted, container-native, developer-first.',
			logo: {
				src: './src/assets/kotauth-negative.svg',
				replacesTitle: true,
			},
			favicon: '/favicon.svg',
			components: {
				ThemeSelect: './src/components/EmptyThemeSelect.astro',
				Head: './src/components/Head.astro',
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/inumansoul/kotauth' },
			],
			customCss: ['./src/styles/custom.css'],
			defaultLocale: 'en',
			expressiveCode: {
				themes: ['github-dark'],
			},
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Quickstart', slug: 'getting-started/quickstart' },
						{ label: 'Live Demo', slug: 'getting-started/demo' },
						{ label: 'Core Concepts', slug: 'getting-started/core-concepts' },
					],
				},
				{
					label: 'Authentication',
					items: [
						{ label: 'Overview', slug: 'authentication/overview' },
						{ label: 'Email & Password', slug: 'authentication/email-password' },
						{ label: 'Authorization Code + PKCE', slug: 'authentication/authorization-code' },
						{ label: 'Client Credentials', slug: 'authentication/client-credentials' },
						{ label: 'Social Login', slug: 'authentication/social-login' },
						{ label: 'Multi-Factor Authentication', slug: 'authentication/mfa' },
						{ label: 'Token Lifecycle', slug: 'authentication/token-lifecycle' },
					],
				},
				{
					label: 'REST API Reference',
					items: [
						{ label: 'Overview & Authentication', slug: 'api/overview' },
						{ label: 'Users', slug: 'api/users' },
						{ label: 'Roles', slug: 'api/roles' },
						{ label: 'Groups', slug: 'api/groups' },
						{ label: 'Applications', slug: 'api/applications' },
						{ label: 'Sessions', slug: 'api/sessions' },
						{ label: 'Audit Logs', slug: 'api/audit-logs' },
					],
				},
				{
					label: 'OIDC / OAuth2 Protocol',
					items: [
						{ label: 'Overview', slug: 'oidc/overview' },
						{ label: 'Discovery & JWKS', slug: 'oidc/discovery' },
						{ label: 'Authorization Endpoint', slug: 'oidc/authorization' },
						{ label: 'Token Endpoint', slug: 'oidc/token' },
						{ label: 'Userinfo Endpoint', slug: 'oidc/userinfo' },
						{ label: 'Introspection & Revocation', slug: 'oidc/introspection-revocation' },
					],
				},
				{
					label: 'Customization',
					items: [
						{ label: 'Webhooks', slug: 'customization/webhooks' },
						{ label: 'White-label Theming', slug: 'customization/theming' },
					],
				},
				{
					label: 'Deployment',
					items: [
						{ label: 'Environment Variables', slug: 'deployment/environment-variables' },
						{ label: 'Docker', slug: 'deployment/docker' },
						{ label: 'Production Checklist', slug: 'deployment/production' },
						{ label: 'External Databases', slug: 'deployment/external-database' },
					],
				},
			],
		}),
	],
});
