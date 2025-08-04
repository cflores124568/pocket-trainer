import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    flex: 1
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    textAlign: 'center',

  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  toggleText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.md,
  },
  input: {
    height: theme.sizes.buttonHeight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    width: '100%',
  },
  errorContainer: {
    backgroundColor: theme.colors.error,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.white,
    textAlign: 'center',
    fontSize: theme.fonts.sizes.sm,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: theme.colors.lightGray,
  },
  buttonActive: {
    backgroundColor: '#CCCCCC', //Gray
  },
  buttonInactive: {
    backgroundColor: theme.colors.primary, //Blue

  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  loginLink: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  loginLinkText: {
    color: theme.colors.primary,
  },
  muscleDiagramExerciseList: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
  },
  muscleDiagramMuscleName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  muscleDiagramExerciseItem: {
    marginBottom: theme.spacing.sm,
  },
  muscleDiagramExerciseName: {
    fontWeight: 'bold',
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.md,
  },
  muscleDiagramVideo: {
    alignSelf: 'stretch',
    height: theme.sizes.videoHeight,
    marginVertical: theme.spacing.sm,
  },
  homeScreenTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    color: theme.colors.text,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: theme.spacing.md,
  },
  diagramContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  activeExerciseItem: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
  },
  videoContainer: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.secondaryBackground,
  },
  videoControlButton: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    alignSelf: 'center',
  },
  playButton: {
    backgroundColor: theme.colors.primary,
  },
  pauseButton: {
    backgroundColor: theme.colors.pause,
  },
  videoControlText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '500',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  saveButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  header: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fonts.sizes.title,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  gif: {
    width: '100%',
    height: theme.sizes.gifHeight,
    backgroundColor: theme.colors.secondaryBackground,
  },
  description: {
    fontSize: theme.fonts.sizes.md,
    lineHeight: 24,
    color: theme.colors.text,
  },
  muscleGroupContainer: {
    marginBottom: theme.spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: theme.colors.secondaryBackground,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.chip,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  chipText: {
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '500',
  },
  recommendedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  recommendedItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  recommendedLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  recommendedValue: {
    fontSize: theme.fonts.sizes.largeValue,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  relatedContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
  },
  relatedExercise: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.secondaryBackground,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    minWidth: 120,
  },
  relatedName: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '500',
    color: theme.colors.text,
  },
  // Added missing styles from ExerciseDetailScreen
  addButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  backButton: {
    padding: theme.spacing.sm
  },
  sectionSubtitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'center',
    width: 100,
  },
  videoButtonText: {
    color: theme.colors.white,
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
  nutritionPreview: {
    marginVertical: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  //CreateWorkoutPlan
  picker: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: theme.spacing.md,
  },
});
