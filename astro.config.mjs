// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';


// https://astro.build/config
export default defineConfig({
	integrations: [
		mermaid({
			theme: 'dark',
			autoTheme: false,
			mermaidConfig: {
				themeVariables: {
					primaryColor: '#0077A8',
					primaryTextColor: '#F0F4F8',
					primaryBorderColor: '#1C2733',
					lineColor: '#64748B',
					secondaryColor: '#111820',
					tertiaryColor: '#0D131A',
					background: '#0A0F14',
					mainBkg: '#0D131A',
					nodeBorder: '#1C2733',
					clusterBkg: '#111820',
					clusterBorder: '#1C2733',
					titleColor: '#F0F4F8',
					edgeLabelBackground: '#0D131A',
					actorBkg: '#0D131A',
					actorBorder: '#0077A8',
					actorTextColor: '#F0F4F8',
					actorLineColor: '#64748B',
					signalColor: '#F0F4F8',
					signalTextColor: '#F0F4F8',
					labelBoxBkgColor: '#0D131A',
					labelBoxBorderColor: '#1C2733',
					labelTextColor: '#F0F4F8',
					loopTextColor: '#94A3B8',
					activationBorderColor: '#0077A8',
					activationBkgColor: '#003d5c',
					sequenceNumberColor: '#F0F4F8',
				},
				fontFamily: "'Inconsolata', monospace",
				sequence: { mirrorActors: false },
			},
		}),
		starlight({
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
						{ label: 'User Invitations', slug: 'authentication/user-invitations' },
						{ label: 'Custom JWT Claims', slug: 'authentication/custom-claims' },
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
						{ label: 'User Attributes', slug: 'api/user-attributes' },
						{ label: 'Claim Mappers', slug: 'api/claim-mappers' },
					],
				},
				{
					label: 'MCP Integration',
					items: [
						{ label: 'Overview', slug: 'mcp/overview' },
						{ label: 'Setup & Configuration', slug: 'mcp/setup' },
						{ label: 'Tool Reference', slug: 'mcp/tools' },
						{ label: 'Examples & Recipes', slug: 'mcp/examples' },
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
						{ label: 'CLI Commands', slug: 'deployment/cli' },
						{ label: 'Key Rotation', slug: 'deployment/key-rotation' },
					],
				},
			],
		}),
	],
});
