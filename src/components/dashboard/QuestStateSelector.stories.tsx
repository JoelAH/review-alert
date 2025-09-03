import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import QuestStateSelector from './QuestStateSelector';
import { QuestState } from '@/lib/models/client/quest';

const theme = createTheme();

const meta: Meta<typeof QuestStateSelector> = {
  title: 'Dashboard/QuestStateSelector',
  component: QuestStateSelector,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <div style={{ padding: '20px', maxWidth: '300px' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A dropdown selector for changing quest states with optimistic updates and accessibility features.',
      },
    },
  },
  argTypes: {
    currentState: {
      control: 'select',
      options: Object.values(QuestState),
      description: 'Current state of the quest',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the selector is disabled',
    },
    size: {
      control: 'select',
      options: ['small', 'medium'],
      description: 'Size of the selector',
    },
    onStateChange: {
      action: 'stateChanged',
      description: 'Callback when state changes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof QuestStateSelector>;

// Mock async function for stories
const mockStateChange = async (questId: string, newState: QuestState) => {
  action('stateChanged')(questId, newState);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
};

export const Open: Story = {
  args: {
    questId: 'quest-1',
    currentState: QuestState.OPEN,
    onStateChange: mockStateChange,
    disabled: false,
    size: 'small',
  },
};

export const InProgress: Story = {
  args: {
    questId: 'quest-2',
    currentState: QuestState.IN_PROGRESS,
    onStateChange: mockStateChange,
    disabled: false,
    size: 'small',
  },
};

export const Done: Story = {
  args: {
    questId: 'quest-3',
    currentState: QuestState.DONE,
    onStateChange: mockStateChange,
    disabled: false,
    size: 'small',
  },
};

export const MediumSize: Story = {
  args: {
    questId: 'quest-4',
    currentState: QuestState.OPEN,
    onStateChange: mockStateChange,
    disabled: false,
    size: 'medium',
  },
};

export const Disabled: Story = {
  args: {
    questId: 'quest-5',
    currentState: QuestState.IN_PROGRESS,
    onStateChange: mockStateChange,
    disabled: true,
    size: 'small',
  },
};

// Story that demonstrates error handling
export const WithError: Story = {
  args: {
    questId: 'quest-6',
    currentState: QuestState.OPEN,
    onStateChange: async (questId: string, newState: QuestState) => {
      action('stateChanged')(questId, newState);
      // Simulate API delay then error
      await new Promise(resolve => setTimeout(resolve, 1000));
      throw new Error('Failed to update quest state');
    },
    disabled: false,
    size: 'small',
  },
  parameters: {
    docs: {
      description: {
        story: 'This story demonstrates error handling - the state will revert to the original after the error.',
      },
    },
  },
};

// Interactive playground story
export const Playground: Story = {
  args: {
    questId: 'quest-playground',
    currentState: QuestState.OPEN,
    onStateChange: mockStateChange,
    disabled: false,
    size: 'small',
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground to test different states and behaviors.',
      },
    },
  },
};

// Story showing all states side by side
export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
      <div>
        <h4>Open State</h4>
        <QuestStateSelector
          questId="quest-open"
          currentState={QuestState.OPEN}
          onStateChange={mockStateChange}
          size="small"
        />
      </div>
      <div>
        <h4>In Progress State</h4>
        <QuestStateSelector
          questId="quest-progress"
          currentState={QuestState.IN_PROGRESS}
          onStateChange={mockStateChange}
          size="small"
        />
      </div>
      <div>
        <h4>Done State</h4>
        <QuestStateSelector
          questId="quest-done"
          currentState={QuestState.DONE}
          onStateChange={mockStateChange}
          size="small"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows all quest states with their respective color coding.',
      },
    },
  },
};