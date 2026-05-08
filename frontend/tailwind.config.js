module.exports = {
	darkMode: ["class"],
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			keyframes: {
				'slide-in-right': {
					from: {
						transform: 'translateX(100%)'
					},
					to: {
						transform: 'translateX(0)'
					}
				}
			},
			animation: {
				'slide-in-right': 'slide-in-right 0.22s ease-out'
			},
			colors: {
				primary: {
					DEFAULT: 'var(--lms-primary)',
					dark: 'var(--lms-primary-dark)',
					light: 'var(--lms-primary-light)',
				},
				secondary: {
					DEFAULT: 'var(--lms-grey)',
					light: 'var(--lms-grey-light)',
				},
				gold: {
					100: 'var(--lms-gold-100)',
					200: 'var(--lms-gold-200)',
					300: 'var(--lms-gold-300)',
					400: 'var(--lms-gold-400)',
					500: 'var(--lms-gold-500)',
					600: 'var(--lms-gold-600)',
					700: 'var(--lms-gold-700)',
					800: 'var(--lms-gold-800)',
					900: 'var(--lms-gold-900)',
					1000: 'var(--lms-gold-1000)',
				},
				surface: 'var(--lms-surface)',
				sidebar: {
					DEFAULT: 'var(--lms-sidebar)',
					active: 'var(--lms-sidebar-active)',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}