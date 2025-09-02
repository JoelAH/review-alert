"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Alert,
} from '@mui/material';
import { Quest, QuestType, QuestPriority } from '@/lib/models/client/quest';

export interface QuestModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (questData: CreateQuestData) => Promise<void>;
    initialData?: Partial<CreateQuestData>;
    mode: 'create' | 'edit';
    quest?: Quest; // For edit mode
}

export interface CreateQuestData {
    title: string;
    details?: string;
    type: QuestType;
    priority: QuestPriority;
    reviewId?: string;
}

// Helper function to get quest type label
const getQuestTypeLabel = (type: QuestType) => {
    switch (type) {
        case QuestType.BUG_FIX:
            return 'Bug Fix';
        case QuestType.FEATURE_REQUEST:
            return 'Feature Request';
        case QuestType.IMPROVEMENT:
            return 'Improvement';
        case QuestType.RESEARCH:
            return 'Research';
        case QuestType.OTHER:
            return 'Other';
        default:
            return 'Unknown';
    }
};

// Helper function to get priority label
const getPriorityLabel = (priority: QuestPriority) => {
    switch (priority) {
        case QuestPriority.HIGH:
            return 'High Priority';
        case QuestPriority.MEDIUM:
            return 'Medium Priority';
        case QuestPriority.LOW:
            return 'Low Priority';
        default:
            return 'Unknown Priority';
    }
};

export default function QuestModal({ 
    open, 
    onClose, 
    onSubmit, 
    initialData, 
    mode, 
    quest 
}: QuestModalProps) {
    const [formData, setFormData] = useState<CreateQuestData>({
        title: '',
        details: '',
        type: QuestType.OTHER,
        priority: QuestPriority.MEDIUM,
        reviewId: undefined,
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form data when modal opens or initialData changes
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && quest) {
                // Pre-populate with quest data for editing
                setFormData({
                    title: quest.title,
                    details: quest.details || '',
                    type: quest.type,
                    priority: quest.priority,
                    reviewId: quest.reviewId,
                });
            } else if (initialData) {
                // Pre-populate with initial data (e.g., from review)
                setFormData({
                    title: initialData.title || '',
                    details: initialData.details || '',
                    type: initialData.type || QuestType.OTHER,
                    priority: initialData.priority || QuestPriority.MEDIUM,
                    reviewId: initialData.reviewId,
                });
            } else {
                // Reset to defaults
                setFormData({
                    title: '',
                    details: '',
                    type: QuestType.OTHER,
                    priority: QuestPriority.MEDIUM,
                    reviewId: undefined,
                });
            }
            setErrors({});
        }
    }, [open, initialData, mode, quest]);

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        // Title is required
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.trim().length < 3) {
            newErrors.title = 'Title must be at least 3 characters long';
        } else if (formData.title.trim().length > 100) {
            newErrors.title = 'Title must be less than 100 characters';
        }

        // Details validation (optional but has limits)
        if (formData.details && formData.details.length > 500) {
            newErrors.details = 'Details must be less than 500 characters';
        }

        // Type validation
        if (!Object.values(QuestType).includes(formData.type)) {
            newErrors.type = 'Please select a valid quest type';
        }

        // Priority validation
        if (!Object.values(QuestPriority).includes(formData.priority)) {
            newErrors.priority = 'Please select a valid priority';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof CreateQuestData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleFieldBlur = (field: keyof CreateQuestData) => {
        // Validate specific field on blur
        const newErrors: { [key: string]: string } = { ...errors };

        if (field === 'title') {
            if (!formData.title.trim()) {
                newErrors.title = 'Title is required';
            } else if (formData.title.trim().length < 3) {
                newErrors.title = 'Title must be at least 3 characters long';
            } else if (formData.title.trim().length > 100) {
                newErrors.title = 'Title must be less than 100 characters';
            } else {
                delete newErrors.title;
            }
        }

        if (field === 'details') {
            if (formData.details && formData.details.length > 500) {
                newErrors.details = 'Details must be less than 500 characters';
            } else {
                delete newErrors.details;
            }
        }

        setErrors(newErrors);
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            handleClose();
        } catch (error) {
            console.error('Error submitting quest:', error);
            // The parent component should handle showing error messages
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setFormData({
                title: '',
                details: '',
                type: QuestType.OTHER,
                priority: QuestPriority.MEDIUM,
                reviewId: undefined,
            });
            setErrors({});
            onClose();
        }
    };

    const isFormValid = formData.title.trim().length >= 3 && 
                       Object.values(QuestType).includes(formData.type) && 
                       Object.values(QuestPriority).includes(formData.priority);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { minHeight: '400px' }
            }}
        >
            <DialogTitle>
                {mode === 'edit' ? 'Edit Quest' : 'Create New Quest'}
            </DialogTitle>

            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    {/* Title Field */}
                    <TextField
                        label="Quest Title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        onBlur={() => handleFieldBlur('title')}
                        error={!!errors.title}
                        helperText={errors.title || 'A clear, concise description of what needs to be done'}
                        fullWidth
                        required
                        variant="outlined"
                        disabled={isSubmitting}
                    />

                    {/* Details Field */}
                    <TextField
                        label="Quest Details"
                        value={formData.details}
                        onChange={(e) => handleInputChange('details', e.target.value)}
                        onBlur={() => handleFieldBlur('details')}
                        error={!!errors.details}
                        helperText={errors.details || 'Optional additional information or context'}
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        disabled={isSubmitting}
                    />

                    {/* Type Selection */}
                    <FormControl fullWidth error={!!errors.type} disabled={isSubmitting}>
                        <InputLabel id="quest-type-label">Quest Type</InputLabel>
                        <Select
                            labelId="quest-type-label"
                            value={formData.type}
                            label="Quest Type"
                            onChange={(e) => handleInputChange('type', e.target.value as QuestType)}
                        >
                            {Object.values(QuestType).map((type) => (
                                <MenuItem key={type} value={type}>
                                    {getQuestTypeLabel(type)}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.type && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                {errors.type}
                            </Typography>
                        )}
                    </FormControl>

                    {/* Priority Selection */}
                    <FormControl fullWidth error={!!errors.priority} disabled={isSubmitting}>
                        <InputLabel id="priority-label">Priority</InputLabel>
                        <Select
                            labelId="priority-label"
                            value={formData.priority}
                            label="Priority"
                            onChange={(e) => handleInputChange('priority', e.target.value as QuestPriority)}
                        >
                            {Object.values(QuestPriority).map((priority) => (
                                <MenuItem key={priority} value={priority}>
                                    {getPriorityLabel(priority)}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.priority && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                {errors.priority}
                            </Typography>
                        )}
                    </FormControl>

                    {/* Show review association info if creating from review */}
                    {formData.reviewId && mode === 'create' && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                            This quest will be associated with the selected review for tracking purposes.
                        </Alert>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button 
                    onClick={handleClose}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!isFormValid || isSubmitting}
                >
                    {isSubmitting 
                        ? (mode === 'edit' ? 'Updating...' : 'Creating...') 
                        : (mode === 'edit' ? 'Update Quest' : 'Create Quest')
                    }
                </Button>
            </DialogActions>
        </Dialog>
    );
}