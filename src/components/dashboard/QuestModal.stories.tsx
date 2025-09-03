import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import QuestModal from './QuestModal';
import { Quest, QuestType, QuestPriority, QuestState } from '@/lib/models/client/quest';

const meta: Meta<typeof QuestModal> = {
    title: 'Dashboard/QuestModal',
    component: QuestModal,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'A modal dialog for creating and editing quests. Supports form validation, pre-population from review data, and both create and edit modes.',
            },
        },
    },
    argTypes: {
        open: {
            control: 'boolean',
            description: 'Controls whether the modal is open or closed',
        },
        mode: {
            control: 'select',
            options: ['create', 'edit'],
            description: 'Determines if the modal is in create or edit mode',
        },
        onClose: {
            action: 'onClose',
            description: 'Callback fired when the modal should be closed',
        },
        onSubmit: {
            action: 'onSubmit',
            description: 'Callback fired when the form is submitted with valid data',
        },
    },
};

export default meta;
type Story = StoryObj<typeof QuestModal>;

// Mock quest data for edit mode stories
const mockQuest: Quest = {
    _id: 'quest-123',
    user: 'user-123',
    reviewId: 'review-123',
    title: 'Fix login authentication bug',
    details: 'Users are unable to log in using Google OAuth. The authentication flow fails at the token exchange step.',
    type: QuestType.BUG_FIX,
    priority: QuestPriority.HIGH,
    state: QuestState.OPEN,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
};

// Mock initial data for create mode with pre-population
const mockInitialData = {
    title: 'Implement dark mode feature',
    details: 'Based on user feedback from review: "Would love to see a dark mode option for better nighttime usage"',
    type: QuestType.FEATURE_REQUEST,
    priority: QuestPriority.MEDIUM,
    reviewId: 'review-456',
};

export const CreateMode: Story = {
    args: {
        open: true,
        mode: 'create',
        onClose: action('onClose'),
        onSubmit: action('onSubmit'),
    },
    parameters: {
        docs: {
            description: {
                story: 'Basic create mode with empty form fields and default values.',
            },
        },
    },
};

export const CreateModeWithPrePopulation: Story = {
    args: {
        open: true,
        mode: 'create',
        initialData: mockInitialData,
        onClose: action('onClose'),
        onSubmit: action('onSubmit'),
    },
    parameters: {
        docs: {
            description: {
                story: 'Create mode with pre-populated data from a review. Shows the review association alert.',
            },
        },
    },
};

export const EditMode: Story = {
    args: {
        open: true,
        mode: 'edit',
        quest: mockQuest,
        onClose: action('onClose'),
        onSubmit: action('onSubmit'),
    },
    parameters: {
        docs: {
            description: {
                story: 'Edit mode with existing quest data pre-populated in the form.',
            },
        },
    },
};

export const Closed: Story = {
    args: {
        open: false,
        mode: 'create',
        onClose: action('onClose'),
        onSubmit: action('onSubmit'),
    },
    parameters: {
        docs: {
            description: {
                story: 'Modal in closed state - nothing should be visible.',
            },
        },
    },
};

// Interactive story that demonstrates form validation
export const FormValidation: Story = {
    args: {
        open: true,
        mode: 'create',
        onClose: action('onClose'),
        onSubmit: async (data) => {
            action('onSubmit')(data);
            // Simulate validation or submission delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        },
    },
    parameters: {
        docs: {
            description: {
                story: 'Demonstrates form validation behavior. Try submitting with empty or invalid data to see validation errors.',
            },
        },
    },
};

// Story showing all quest types and priorities
export const AllOptions: Story = {
    args: {
        open: true,
        mode: 'create',
        initialData: {
            title: 'Sample quest with all options visible',
            details: 'This story shows all available quest types and priority options in the dropdowns.',
            type: QuestType.RESEARCH,
            priority: QuestPriority.LOW,
        },
        onClose: action('onClose'),
        onSubmit: action('onSubmit'),
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows all available quest types and priority options. Useful for reviewing the complete set of options.',
            },
        },
    },
};

// Story demonstrating error handling
export const SubmissionError: Story = {
    args: {
        open: true,
        mode: 'create',
        initialData: {
            title: 'Quest that will fail to submit',
            details: 'This demonstrates error handling during submission.',
            type: QuestType.BUG_FIX,
            priority: QuestPriority.HIGH,
        },
        onClose: action('onClose'),
        onSubmit: async (data) => {
            action('onSubmit')(data);
            // Simulate submission error
            await new Promise(resolve => setTimeout(resolve, 1000));
            throw new Error('Simulated submission error');
        },
    },
    parameters: {
        docs: {
            description: {
                story: 'Demonstrates error handling when submission fails. The modal remains open and logs the error.',
            },
        },
    },
};

// Story for mobile/responsive testing
export const MobileView: Story = {
    args: {
        open: true,
        mode: 'create',
        initialData: mockInitialData,
        onClose: action('onClose'),
        onSubmit: action('onSubmit'),
    },
    parameters: {
        viewport: {
            defaultViewport: 'mobile1',
        },
        docs: {
            description: {
                story: 'Modal displayed on mobile viewport to test responsive behavior.',
            },
        },
    },
};