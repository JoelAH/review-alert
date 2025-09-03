'use client';

import React, { useState } from 'react';
import { Button, CircularProgress, Typography, useTheme } from '@mui/material';
import { Add as AddIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { Review, ReviewQuest } from '@/lib/models/client/review';
import { QuestType, QuestPriority } from '@/lib/models/client/quest';
import { QuestService, QuestError } from '@/lib/services/quests';
import { NotificationService } from '@/lib/services/notifications';
import QuestModal, { CreateQuestData } from './QuestModal';

export interface CreateQuestButtonProps {
  review: Review;
  onQuestCreated?: (questId: string) => void;
  disabled?: boolean;
}

// Helper function to map review quest type to quest type
const mapReviewQuestToQuestType = (reviewQuest?: ReviewQuest): QuestType => {
  switch (reviewQuest) {
    case ReviewQuest.BUG:
      return QuestType.BUG_FIX;
    case ReviewQuest.FEATURE_REQUEST:
      return QuestType.FEATURE_REQUEST;
    case ReviewQuest.OTHER:
    default:
      return QuestType.IMPROVEMENT;
  }
};

// Helper function to map review priority to quest priority
const mapReviewPriorityToQuestPriority = (reviewPriority?: string): QuestPriority => {
  switch (reviewPriority) {
    case 'HIGH':
      return QuestPriority.HIGH;
    case 'MEDIUM':
      return QuestPriority.MEDIUM;
    case 'LOW':
      return QuestPriority.LOW;
    default:
      return QuestPriority.MEDIUM;
  }
};

const CreateQuestButton: React.FC<CreateQuestButtonProps> = ({
  review,
  onQuestCreated,
  disabled = false,
}) => {
  const theme = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Check if quest already exists for this review
  const questAlreadyExists = Boolean(review.questId);

  const handleOpenModal = () => {
    if (!questAlreadyExists && !disabled) {
      setModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleCreateQuest = async (questData: CreateQuestData) => {
    setIsCreating(true);
    try {
      const createdQuest = await QuestService.createQuest(questData);

      // Show success notification
      NotificationService.success('Quest created successfully');

      onQuestCreated?.(createdQuest._id);
      setModalOpen(false);
    } catch (error) {
      console.error('Error creating quest:', error);
      
      const questError = QuestError.fromError(error);
      
      // Show error notification
      NotificationService.error(QuestService.getErrorMessage(questError));
      
      throw questError; // Let the modal handle the error display
    } finally {
      setIsCreating(false);
    }
  };

  // Pre-populate quest data from review
  const getInitialQuestData = (): Partial<CreateQuestData> => {
    return {
      title: `Review: ${review.comment.substring(0, 50)}${review.comment.length > 50 ? '...' : ''}`,
      details: `From review by ${review.name}:\n\n"${review.comment}"\n\nRating: ${review.rating}/5 stars`,
      type: mapReviewQuestToQuestType(review.quest),
      priority: mapReviewPriorityToQuestPriority(review.priority),
      reviewId: review._id,
    };
  };

  // If quest already exists, show just text
  if (questAlreadyExists) {
    return (
      <Typography
        variant="caption"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          color: theme.palette.success.main,
          fontSize: '0.7rem',
          fontWeight: 500,
          px: 1,
          py: 0.25,
        }}
      >
        <CheckIcon sx={{ fontSize: 14 }} />
        Quest Created
      </Typography>
    );
  }

  const isButtonDisabled = disabled || isCreating;

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={
          isCreating ? (
            <CircularProgress size={14} />
          ) : (
            <AddIcon sx={{ fontSize: 16 }} />
          )
        }
        onClick={handleOpenModal}
        disabled={isButtonDisabled}
        sx={{
          minWidth: 'auto',
          px: 1,
          py: 0.25,
          fontSize: '0.7rem',
          textTransform: 'none',
          borderRadius: 1,
          backgroundColor: 'background.paper',
          borderColor: 'primary.main',
          color: 'primary.main',
          boxShadow: 1,
          '&:hover': {
            backgroundColor: 'primary.light',
            color: 'white',
            transform: 'translateY(-1px)',
            boxShadow: 2,
          },
          '&:disabled': {
            backgroundColor: 'grey.100',
            color: 'grey.500',
          },
        }}
      >
        Create Quest
      </Button>

      <QuestModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateQuest}
        initialData={getInitialQuestData()}
        mode="create"
      />
    </>
  );
};

export default CreateQuestButton;