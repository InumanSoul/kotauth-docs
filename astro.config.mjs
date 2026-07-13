// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';

export default defineConfig({
	site: 'https://docs.kotauth.com',
	output: 'static',
	integrations: [
		mermaid({
			theme: 'default',
			autoTheme: true,
			mermaidConfig: {
				themeVariables: {
					primaryColor: '#0077A8',
					primaryTextColor: '#FFFFFF',
					primaryBorderColor: '#005A80',
					secondaryColor: '#0090CB',
					tertiaryColor: '#58D2FF',
					lineColor: '#64748B',
					actorBorder: '#0077A8',
					activationBorderColor: '#0077A8',
				},
				fontFamily: "'JetBrains Mono', monospace",
				sequence: { mirrorActors: false },
			},
		}),
		starlight({
			title: 'Kotauth',
			description: 'Identity infrastructure for modern applications. Self-hosted, container-native, developer-first.',
			logo: {
				light: './src/assets/kotauth-brand.svg',
				dark: './src/assets/kotauth-negative.svg',
				replacesTitle: true,
			},
			favicon: '/favicon.svg',
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
						{ label: 'Magic-Link Passwordless', slug: 'authentication/magic-links' },
						{ label: 'Email OTP Passwordless', slug: 'authentication/email-otp' },
						{ label: 'Passkeys & WebAuthn', slug: 'authentication/passkeys' },
						{ label: 'Authorization Code + PKCE', slug: 'authentication/authorization-code' },
						{ label: 'Client Credentials', slug: 'authentication/client-credentials' },
						{ label: 'Social Login', slug: 'authentication/social-login' },
						{ label: 'Multi-Factor Authentication', slug: 'authentication/mfa' },
						{ label: 'Token Lifecycle', slug: 'authentication/token-lifecycle' },
						{ label: 'User Invitations', slug: 'authentication/user-invitations' },
						{ label: 'Custom JWT Claims', slug: 'authentication/custom-claims' },
						{ label: 'Admin Impersonation', slug: 'authentication/impersonation' },
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
						{ label: 'Silent SSO', slug: 'oidc/silent-sso' },
					],
				},
				{
					label: 'Customization',
					items: [
						{ label: 'Webhooks', slug: 'customization/webhooks' },
						{ label: 'White-label Theming', slug: 'customization/theming' },
						{ label: 'Email Branding', slug: 'customization/email-branding' },
						{ label: 'Internationalization (i18n)', slug: 'customization/i18n' },
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
						{ label: 'Backup & Restore', slug: 'deployment/backup-restore' },
						{ label: 'Redis', slug: 'deployment/redis' },
					],
				},
			],
		}),
	],
});
