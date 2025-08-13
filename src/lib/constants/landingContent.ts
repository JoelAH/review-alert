import {
    NotificationsActive,
    Psychology,
    LocalOffer,
    Assignment,
    ViewModule,
    Devices
} from '@mui/icons-material';
import { LandingPageContent } from '@/types/landing';

export const LANDING_PAGE_CONTENT: LandingPageContent = {
    hero: {
        title: "Aggregate App Reviews, Get Smart Notifications, Level Up Your Product",
        subtitle: "Review Alert aggregates reviews from Chrome Web Store, Google Play, and iOS App Store, then uses AI to analyze sentiment, generate actionable tasks, and gamify your review management workflow for solo entrepreneurs and small startups.",
        ctaText: "Start Your Journey"
    },
    features: [
        {
            icon: ViewModule,
            title: "Review Aggregation",
            description: "Automatically collect and centralize all your app reviews in one unified dashboard, eliminating the need to check multiple platforms manually.",
            isPrimary: true
        },
        {
            icon: NotificationsActive,
            title: "Smart Notifications",
            description: "Get instant alerts when new reviews arrive, with AI-powered urgency detection for critical feedback requiring immediate attention.",
            isPrimary: true
        },
        {
            icon: Devices,
            title: "Multi-Store Support",
            description: "Monitor reviews across Chrome Web Store, Google Play Store, and iOS App Store - all your platforms covered in one place.",
            isPrimary: true
        },
        {
            icon: Psychology,
            title: "AI Sentiment Analysis",
            description: "Understand the emotional tone of your reviews with advanced sentiment detection that identifies positive, negative, and neutral feedback patterns."
        },
        {
            icon: LocalOffer,
            title: "Review Categorization",
            description: "Automatically organize reviews by topics, features, and issues using AI-powered tagging for easier analysis and response prioritization."
        },
        {
            icon: Assignment,
            title: "Automated Task Generation",
            description: "Transform review insights into actionable development tasks and improvement suggestions that integrate directly into your workflow."
        }
    ],
    gamification: {
        sampleXP: 1250,
        sampleLevel: 3,
        sampleTasks: [
            {
                id: "1",
                title: "Respond to 5 negative reviews",
                xpReward: 150,
                completed: true
            },
            {
                id: "2",
                title: "Fix bug mentioned in reviews",
                xpReward: 300,
                completed: true
            },
            {
                id: "3",
                title: "Implement feature request",
                xpReward: 500,
                completed: false
            },
            {
                id: "4",
                title: "Analyze sentiment trends",
                xpReward: 100,
                completed: true
            }
        ]
    },
    personas: [
        {
            title: "Solo Entrepreneur",
            description: "Building multiple products with limited time for manual review monitoring",
            painPoints: [
                "Juggling multiple apps across different stores",
                "Missing critical feedback while focusing on development",
                "No time for manual review checking",
                "Difficulty prioritizing which reviews need immediate attention"
            ],
            benefits: [
                "Automated review aggregation saves hours weekly",
                "AI prioritizes urgent reviews requiring immediate response",
                "Gamification makes review management engaging",
                "Actionable tasks integrate feedback into development workflow"
            ]
        },
        {
            title: "Solo Developer",
            description: "Managing app store presence while coding new features",
            painPoints: [
                "Switching between multiple app store dashboards",
                "Forgetting to check for new reviews regularly",
                "Struggling to extract actionable insights from feedback",
                "Losing motivation when dealing with negative reviews"
            ],
            benefits: [
                "Single dashboard for all app store reviews",
                "Smart notifications ensure no review goes unnoticed",
                "AI transforms feedback into concrete development tasks",
                "XP system gamifies the review response process"
            ]
        },
        {
            title: "Small Startup Team",
            description: "Resource-constrained team needing efficient review management",
            painPoints: [
                "Limited bandwidth for comprehensive review monitoring",
                "Difficulty coordinating review responses across team",
                "Manual sentiment analysis is time-consuming",
                "No systematic approach to incorporating user feedback"
            ],
            benefits: [
                "Automated aggregation reduces manual monitoring overhead",
                "AI analysis provides instant sentiment insights",
                "Task generation creates systematic feedback incorporation",
                "Gamification encourages team engagement with user feedback"
            ]
        }
    ],
    differentiation: {
        title: "Why Review Alert Goes Beyond Basic Review Monitoring",
        subtitle: "Most tools just show you reviews. We transform them into actionable insights and engaging experiences.",
        comparisons: [
            {
                basic: "Manual checking of multiple app store dashboards",
                reviewAlert: "Automated aggregation from all stores in one unified dashboard",
                benefit: "Save 5+ hours weekly on manual review monitoring"
            },
            {
                basic: "Reading reviews one by one to understand sentiment",
                reviewAlert: "AI-powered sentiment analysis with instant insights",
                benefit: "Understand user feedback patterns in seconds, not hours"
            },
            {
                basic: "Manually creating tasks from review feedback",
                reviewAlert: "Automated task generation with workflow integration",
                benefit: "Transform feedback into actionable development items automatically"
            },
            {
                basic: "Losing motivation when dealing with negative reviews",
                reviewAlert: "Gamified experience with XP rewards for review management",
                benefit: "Stay engaged and motivated while improving your product"
            }
        ],
        uniqueValue: {
            title: "The Only Platform Combining AI Analysis + Gamification",
            description: "Review Alert is the first review management platform to combine comprehensive aggregation, AI-powered analysis, and gamification into one seamless experience designed specifically for solo entrepreneurs and small teams.",
            highlights: [
                "AI + Gamification: Unique combination that makes review management engaging while providing deep insights",
                "Workflow Integration: Generated tasks integrate directly into your development process",
                "Solo-Focused Design: Built specifically for resource-constrained teams and individual developers",
                "Comprehensive Automation: From aggregation to analysis to task creation - fully automated pipeline"
            ]
        }
    },
    finalCTA: {
        title: "Ready to Transform Your Review Management?",
        description: "Join solo entrepreneurs and small teams who are already using AI-powered review aggregation to build better products and level up their development process.",
        ctaText: "Start Your Journey"
    },
    ctaSections: {
        hero: {
            primary: "Start Your Journey",
            secondary: ["Learn More", "See Demo"]
        },
        midPage: {
            title: "Ready to Level Up Your Review Game?",
            description: "See how AI-powered review aggregation and gamification can transform your product development workflow.",
            primary: "Begin Your Quest",
            secondary: ["Explore Features", "Watch Demo"]
        },
        final: {
            title: "Transform Reviews Into XP and Action",
            description: "Join the growing community of developers who are turning review management into an engaging, productive experience.",
            primary: "Start Your Journey",
            secondary: ["Learn More"]
        }
    }
};

// Additional content constants for flexibility
export const CTA_VARIANTS = {
    primary: "Start Your Journey",
    secondary: "Learn More",
    demo: "See Demo",
    signup: "Get Started Free"
};

export const MESSAGING_FOCUS = {
    primary: "Review Aggregation & Notifications",
    secondary: "AI-Powered Analysis",
    tertiary: "Gamification & XP System"
};