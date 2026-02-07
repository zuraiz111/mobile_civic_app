import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	TextInput,
	Alert,
	Image,
	Modal,
	Dimensions,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { useTheme } from '../../src/context/ThemeContext';
import { getDeptIcon } from '../../src/utils/adminUtils';

export default function CreateReportScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const { addReport, currentUser, departments } = useApp();
	const { t } = useLanguage();
	const { theme } = useTheme();

	const { width } = Dimensions.get('window');
	const categoryCardWidth = (width - 48 - 16) / 2; // 48 is horizontal padding, 16 is gap

	// State
	const [category, setCategory] = useState(params.category || null);
	const [title] = useState('');
	const [description, setDescription] = useState('');
	const [location, setLocation] = useState('');
	const [locationHeight, setLocationHeight] = useState(70); // Default 2-line height
	const [originalLocation, setOriginalLocation] = useState(null);
	const [priority, setPriority] = useState('Medium');
	const [contactInfo, setContactInfo] = useState('');
	const [mediaItems, setMediaItems] = useState([]);
	const [isLocating, setIsLocating] = useState(false);
	const [showEvidenceHelp, setShowEvidenceHelp] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitProgress, setSubmitProgress] = useState(0); // 0 to 1

	// Auto-fetch location when category is selected
	useEffect(() => {
		if (category && !originalLocation) {
			console.log('Fetching GPS location...');
			getCurrentLocation();
		}
	}, [category, originalLocation, getCurrentLocation]);

	useEffect(() => {
		console.log('Original location:', originalLocation);
		console.log('Location text:', location);
	}, [originalLocation, location]);

	const selectedCategoryDetails = category
		? departments.find((c) => c.id === category)
		: null;
	const selectedIcon = selectedCategoryDetails
		? getDeptIcon(selectedCategoryDetails.name)
		: null;
	// --- Actions ---

	const getCurrentLocation = useCallback(async () => {
		setIsLocating(true);
		const { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== 'granted') {
			console.log('Location permission denied');
			Alert.alert(
				'Location Permission Required',
				'To accurately identify the incident location, please allow location access in your device settings.',
			);
			setIsLocating(false);
			return;
		}

		try {
			const loc = await Location.getCurrentPositionAsync({});
			console.log('GPS coords:', loc.coords);

			const address = await Location.reverseGeocodeAsync({
				latitude: loc.coords.latitude,
				longitude: loc.coords.longitude,
			});

			let locationString = '';
			if (address.length > 0) {
				const addr = address[0];
				const parts = [
					addr.street,
					addr.name,
					addr.city,
					addr.region,
				].filter(Boolean);
				locationString = parts.join(', ');
			}

			const locationData = {
				address: locationString || 'Fetching address...',
				latitude: loc.coords.latitude,
				longitude: loc.coords.longitude,
				timestamp: new Date().toISOString(),
			};

			setLocation(locationData.address);
			setOriginalLocation(locationData);
		} catch (error) {
			console.log('Location error', error);
		} finally {
			setIsLocating(false);
		}
	}, []);

	const pickMedia = useCallback(
		async (mode) => {
			if (mediaItems.length >= 5) {
				Alert.alert(t('limitReached'), t('maxEvidenceLimit'));
				return;
			}

			const hasPermission = mode.includes('camera')
				? (await ImagePicker.requestCameraPermissionsAsync()).granted
				: (await ImagePicker.requestMediaLibraryPermissionsAsync()).granted;

			if (!hasPermission) {
				Alert.alert(t('permissionRequired'), t('grantAccessToContinue'));
				return;
			}

			let result;
			const options = {
				allowsEditing: true,
				quality: 0.8,
			};

			if (mode === 'camera_photo') {
				result = await ImagePicker.launchCameraAsync({
					...options,
					mediaTypes: ImagePicker.MediaTypeOptions.Images,
				});
			} else if (mode === 'camera_video') {
				result = await ImagePicker.launchCameraAsync({
					...options,
					mediaTypes: ImagePicker.MediaTypeOptions.Videos,
				});
			} else {
				result = await ImagePicker.launchImageLibraryAsync({
					...options,
					mediaTypes: ImagePicker.MediaTypeOptions.All,
				});
			}

			if (!result.canceled && result.assets && result.assets.length > 0) {
				const newItem = result.assets[0];
				setMediaItems((prev) => [
					...prev,
					{ uri: newItem.uri, type: newItem.type },
				]);
			}
		},
		[mediaItems.length, t],
	);

	const removeMedia = useCallback((index) => {
		setMediaItems((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const handleSubmit = useCallback(() => {
		if (!category) {
			Alert.alert(t('missingInfo'), t('selectCategory'));
			return;
		}
		if (!description.trim()) {
			Alert.alert(t('missingInfo'), t('enterDescription'));
			return;
		}
		if (!originalLocation) {
			Alert.alert(
				'Location Required',
				'Please provide the incident location',
			);
			return;
		}

		Alert.alert(t('confirmSubmit'), t('areYouSureSubmit'), [
			{ text: t('cancel'), style: 'cancel' },
			{
				text: t('submit'),
				onPress: async () => {
					setIsSubmitting(true);
					setSubmitProgress(0.1);
					try {
						// Simulate progress for professional feel
						const progressInterval = setInterval(() => {
							setSubmitProgress((prev) => {
								if (prev >= 0.8) {
									clearInterval(progressInterval);
									return 0.8;
								}
								return prev + 0.1;
							});
						}, 300);

						await addReport({
							userId: currentUser.uid || currentUser.id,
							category,
							title: title || description.slice(0, 30) + '...',
							description,
							location,
							priority,
							contactInfo,
							media: mediaItems,
							photo: mediaItems.length > 0 ? mediaItems[0].uri : null,
						});

						clearInterval(progressInterval);
						setSubmitProgress(1);

						// Small delay to show completion state
						setTimeout(() => {
							setIsSubmitting(false);
							router.replace('/(user)/reports');
						}, 800);
					} catch (e) {
						setIsSubmitting(false);
						Alert.alert('Error', 'Failed to submit report');
					}
				},
			},
		]);
	}, [
		addReport,
		category,
		contactInfo,
		currentUser.id,
		currentUser.uid,
		description,
		location,
		mediaItems,
		originalLocation,
		priority,
		router,
		t,
		title,
	]);

	// --- Components ---

	const renderCategorySelection = () => (
		<SafeAreaView style={styles.selectionContainer}>
			<View style={styles.selectionHeader}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Ionicons name="arrow-back" size={24} color="#374151" />
				</TouchableOpacity>
				<Text style={styles.selectionTitle}>Select Category</Text>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView
				contentContainerStyle={styles.categoryGrid}
				showsVerticalScrollIndicator={false}
			>
				{departments
					.filter((d) => d.isActive !== false)
					.map((cat) => {
						const icon = getDeptIcon(cat.name);
						return (
							<TouchableOpacity
								key={cat.id}
								style={[
									styles.categoryCardLarge,
									{ width: categoryCardWidth },
								]}
								onPress={() => setCategory(cat.id)}
								activeOpacity={0.7}
							>
								<View
									style={[
										styles.categoryIconCircle,
										{ backgroundColor: icon.color + '15' },
									]}
								>
									<Text style={{ fontSize: 32 }}>
										{icon.icon}
									</Text>
								</View>
								<Text style={styles.categoryNameLarge}>
									{cat.name}
								</Text>
							</TouchableOpacity>
						);
					})}
			</ScrollView>
		</SafeAreaView>
	);

	if (!category) {
		return renderCategorySelection();
	}

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			{/* Header */}
			<View
				style={[styles.header, { borderBottomColor: theme.colors.border }]}
			>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.headerBtn}
				>
					<Ionicons name="close" size={26} color={theme.colors.text} />
				</TouchableOpacity>
				<View style={styles.headerCenter}>
					<Text
						style={[styles.headerTitle, { color: theme.colors.text }]}
					>
						Submit Report
					</Text>
				</View>
				<View style={styles.headerBtn} />
			</View>

			<ScrollView
				style={styles.formScroll}
				showsVerticalScrollIndicator={false}
			>
				{/* 1. Selected Category Card */}
				<View
					style={[
						styles.card,
						styles.categorySelectedCard,
						{ backgroundColor: theme.colors.card },
					]}
				>
					<View style={styles.categoryBadge}>
						<Text style={styles.badgeText}>SELECTED CATEGORY</Text>
					</View>
					<View style={styles.categoryHeader}>
						<View style={styles.catInfo}>
							<View
								style={[
									styles.catIconContainer,
									{
										backgroundColor:
											theme.colors.inputBackground,
									},
								]}
							>
								{selectedIcon ? (
									<Text style={{ fontSize: 24 }}>
										{selectedIcon.icon}
									</Text>
								) : (
									<Text style={styles.catIcon}>📋</Text>
								)}
							</View>
							<View>
								<Text
									style={[
										styles.catName,
										{ color: theme.colors.text },
									]}
								>
									{selectedCategoryDetails?.name}
								</Text>
								<Text
									style={[
										styles.catSubtext,
										{ color: theme.colors.textSecondary },
									]}
								>
									Provide details below
								</Text>
							</View>
						</View>
						<TouchableOpacity
							onPress={() => setCategory(null)}
							style={[
								styles.changeBtn,
								{ borderColor: theme.colors.border },
							]}
						>
							<Text
								style={[
									styles.changeBtnText,
									{ color: theme.colors.primary },
								]}
							>
								Change
							</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* 2. Incident Location */}
				<View style={[styles.card, { backgroundColor: theme.colors.card }]}>
					<View style={styles.labelRow}>
						<Ionicons
							name="location"
							size={20}
							color={theme.colors.notification}
							style={styles.labelIcon}
						/>
						<Text
							style={[
								styles.cardLabel,
								{ color: theme.colors.textSecondary },
							]}
						>
							INCIDENT LOCATION
						</Text>
						<Text style={styles.required}>*</Text>
					</View>
					<Text
						style={[
							styles.fieldDescription,
							{ color: theme.colors.textSecondary },
						]}
					>
						Where did this incident occur?
					</Text>

					<View
						style={[
							styles.inputRow,
							{
								height: locationHeight,
								alignItems: 'flex-start',
								backgroundColor: theme.colors.inputBackground,
								borderColor: theme.colors.border,
							},
						]}
					>
						<Ionicons
							name="location-outline"
							size={18}
							color={theme.colors.primary}
							style={{ marginRight: 10, marginTop: 3 }}
						/>
						<TextInput
							style={[
								styles.textInputFlex,
								{
									height: '100%',
									fontSize: 14,
									color: theme.colors.text,
								},
							]}
							value={location}
							onChangeText={(text) => {
								setLocation(text);
							}}
							onContentSizeChange={(e) => {
								// Auto-expand height based on content, min 70px (2 lines), max 120px
								const height = Math.max(
									70,
									Math.min(
										120,
										e.nativeEvent.contentSize.height + 20,
									),
								);
								setLocationHeight(height);
							}}
							placeholder="Enter incident location address"
							placeholderTextColor={theme.colors.textSecondary}
							multiline
							textAlignVertical="top"
						/>
					</View>

					<TouchableOpacity
						style={[
							styles.currentLocBtn,
							{
								backgroundColor: theme.colors.inputBackground,
								borderColor: theme.colors.border,
							},
						]}
						onPress={getCurrentLocation}
					>
						{isLocating ? (
							<View style={styles.locationBtnContent}>
								<Ionicons
									name="navigate-circle"
									size={18}
									color={theme.colors.success}
								/>
								<Text
									style={[
										styles.currentLocText,
										{ color: theme.colors.text },
									]}
								>
									Locating...
								</Text>
							</View>
						) : (
							<View style={styles.locationBtnContent}>
								<Ionicons
									name="navigate-circle-outline"
									size={18}
									color={theme.colors.success}
								/>
								<Text
									style={[
										styles.currentLocText,
										{ color: theme.colors.text },
									]}
								>
									Use Current Location
								</Text>
							</View>
						)}
					</TouchableOpacity>
				</View>

				{/* 3. Description */}
				<View style={[styles.card, { backgroundColor: theme.colors.card }]}>
					<View style={styles.labelRow}>
						<Ionicons
							name="document-text"
							size={20}
							color={theme.colors.notification}
							style={styles.labelIcon}
						/>
						<Text
							style={[
								styles.cardLabel,
								{ color: theme.colors.textSecondary },
							]}
						>
							INCIDENT DESCRIPTION
						</Text>
						<Text style={styles.required}>*</Text>
					</View>
					<Text
						style={[
							styles.fieldDescription,
							{ color: theme.colors.textSecondary },
						]}
					>
						Describe what happened in detail
					</Text>

					<TextInput
						style={[
							styles.textArea,
							{
								backgroundColor: theme.colors.inputBackground,
								borderColor: theme.colors.border,
								color: theme.colors.text,
							},
						]}
						value={description}
						onChangeText={setDescription}
						placeholder="Describe the incident in detail..."
						placeholderTextColor={theme.colors.textSecondary}
						multiline
						numberOfLines={5}
						textAlignVertical="top"
					/>
					<Text
						style={[
							styles.charCount,
							{ color: theme.colors.textSecondary },
						]}
					>
						{description.length} characters
					</Text>
				</View>

				{/* 4. Evidence Section */}
				<View style={[styles.card, { backgroundColor: theme.colors.card }]}>
					<View style={styles.evidenceHeader}>
						<View style={styles.labelRow}>
							<Ionicons
								name="camera"
								size={20}
								color={theme.colors.primary}
								style={styles.labelIcon}
							/>
							<Text
								style={[
									styles.cardLabel,
									{ color: theme.colors.textSecondary },
								]}
							>
								ADD EVIDENCE
							</Text>
							<TouchableOpacity
								onPress={() => setShowEvidenceHelp(true)}
								style={styles.helpIconBtn}
							>
								<Ionicons
									name="help-circle"
									size={22}
									color={theme.colors.primary}
								/>
							</TouchableOpacity>
						</View>
						<Text
							style={[
								styles.evidenceSubtitle,
								{ color: theme.colors.textSecondary },
							]}
						>
							Photos and videos help verify your report and speed up
							resolution
						</Text>
					</View>

					{/* Media Action Cards */}
					<View style={styles.mediaGrid}>
						<TouchableOpacity
							style={[
								styles.mediaCard,
								styles.cameraCard,
								{ backgroundColor: theme.colors.primary },
							]}
							onPress={() => pickMedia('camera_photo')}
						>
							<View style={styles.mediaIconCircle}>
								<Ionicons name="camera" size={28} color="#fff" />
							</View>
							<Text style={styles.mediaCardTitle}>Camera</Text>
							<Text style={styles.mediaCardDesc}>Take Photo</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.mediaCard,
								styles.galleryCard,
								{ backgroundColor: theme.colors.success },
							]}
							onPress={() => pickMedia('gallery')}
						>
							<View style={styles.mediaIconCircle}>
								<Ionicons name="images" size={28} color="#fff" />
							</View>
							<Text style={styles.mediaCardTitle}>Gallery</Text>
							<Text style={styles.mediaCardDesc}>Choose Files</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.mediaCard,
								styles.videoCard,
								{ backgroundColor: theme.colors.notification },
							]}
							onPress={() => pickMedia('camera_video')}
						>
							<View style={styles.mediaIconCircle}>
								<Ionicons name="videocam" size={28} color="#fff" />
							</View>
							<Text style={styles.mediaCardTitle}>Video</Text>
							<Text style={styles.mediaCardDesc}>Record Video</Text>
						</TouchableOpacity>
					</View>

					{/* Previews */}
					{mediaItems.length > 0 && (
						<View style={styles.previewSection}>
							<Text
								style={[
									styles.previewHeader,
									{ color: theme.colors.text },
								]}
							>
								Uploaded Files ({mediaItems.length}/5)
							</Text>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								style={styles.mediaScroll}
							>
								{mediaItems.map((item, index) => (
									<View
										key={index}
										style={styles.mediaPreviewItem}
									>
										{item.type === 'video' ? (
											<View
												style={[
													styles.videoPlaceholder,
													{
														backgroundColor:
															theme.colors
																.inputBackground,
													},
												]}
											>
												<Ionicons
													name="play-circle"
													size={36}
													color={theme.colors.text}
												/>
												<Text
													style={[
														styles.videoLabel,
														{
															color: theme.colors
																.text,
														},
													]}
												>
													Video
												</Text>
											</View>
										) : (
											<Image
												source={{ uri: item.uri }}
												style={styles.previewImage}
											/>
										)}
										<TouchableOpacity
											style={styles.removeMediaBtn}
											onPress={() => removeMedia(index)}
										>
											<Ionicons
												name="close-circle"
												size={26}
												color={theme.colors.notification}
											/>
										</TouchableOpacity>
									</View>
								))}
							</ScrollView>
						</View>
					)}
				</View>

				{/* 5. Priority */}
				<View style={[styles.card, { backgroundColor: theme.colors.card }]}>
					<View style={styles.labelRow}>
						<Ionicons
							name="flag"
							size={20}
							color={theme.colors.primary}
							style={styles.labelIcon}
						/>
						<Text
							style={[
								styles.cardLabel,
								{ color: theme.colors.textSecondary },
							]}
						>
							PRIORITY LEVEL
						</Text>
					</View>
					<Text
						style={[
							styles.fieldDescription,
							{ color: theme.colors.textSecondary },
						]}
					>
						How urgent is this issue?
					</Text>

					<View style={styles.priorityRow}>
						{[
							{
								key: 'Low',
								icon: 'remove-circle',
								color: theme.colors.success,
								bg: theme.dark ? '#064e3b' : '#d1fae5',
							},
							{
								key: 'Medium',
								icon: 'alert-circle',
								color: '#f59e0b',
								bg: theme.dark ? '#78350f' : '#fef3c7',
							},
							{
								key: 'High',
								icon: 'warning',
								color: theme.colors.notification,
								bg: theme.dark ? '#7f1d1d' : '#fee2e2',
							},
						].map((p) => {
							const isSelected = priority === p.key;
							return (
								<TouchableOpacity
									key={p.key}
									style={[
										styles.priorityChip,
										{
											backgroundColor: isSelected
												? p.color
												: p.bg,
										},
										isSelected && styles.prioritySelected,
									]}
									onPress={() => setPriority(p.key)}
								>
									<Ionicons
										name={p.icon}
										size={22}
										color={isSelected ? '#fff' : p.color}
										style={styles.priorityIcon}
									/>
									<Text
										style={[
											styles.priorityText,
											{
												color: isSelected
													? '#fff'
													: p.color,
											},
										]}
									>
										{p.key}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				</View>

				{/* 6. Contact Info */}
				<View style={[styles.card, { backgroundColor: theme.colors.card }]}>
					<View style={styles.labelRow}>
						<Ionicons
							name="call"
							size={20}
							color={theme.colors.primary}
							style={styles.labelIcon}
						/>
						<Text
							style={[
								styles.cardLabel,
								{ color: theme.colors.textSecondary },
							]}
						>
							CONTACT INFORMATION
						</Text>
						<Text
							style={[
								styles.optionalText,
								{ color: theme.colors.textSecondary },
							]}
						>
							(Optional)
						</Text>
					</View>
					<Text
						style={[
							styles.fieldDescription,
							{ color: theme.colors.textSecondary },
						]}
					>
						You may provide an alternative contact number if someone
						else can be reached regarding this report.
					</Text>

					<View
						style={[
							styles.inputRow,
							{
								backgroundColor: theme.colors.inputBackground,
								borderColor: theme.colors.border,
							},
						]}
					>
						<Ionicons
							name="call-outline"
							size={20}
							color={theme.colors.primary}
							style={{ marginRight: 10 }}
						/>
						<TextInput
							style={[
								styles.textInputFlex,
								{ color: theme.colors.text },
							]}
							value={contactInfo}
							onChangeText={setContactInfo}
							placeholder="Enter phone number (optional)"
							placeholderTextColor={theme.colors.textSecondary}
							keyboardType="phone-pad"
						/>
					</View>
					<View style={styles.privacyNote}>
						<Ionicons
							name="lock-closed"
							size={14}
							color={theme.colors.success}
						/>
						<Text
							style={[
								styles.privacyText,
								{ color: theme.colors.success },
							]}
						>
							Your information will be kept confidential
						</Text>
					</View>
				</View>

				{/* 7. Submit Button */}
				<TouchableOpacity
					style={[
						styles.submitBtn,
						{ backgroundColor: theme.colors.primary },
					]}
					onPress={handleSubmit}
				>
					<Ionicons
						name="paper-plane"
						size={22}
						color="#fff"
						style={{ marginRight: 10 }}
					/>
					<Text style={styles.submitBtnText}>Submit Report</Text>
				</TouchableOpacity>

				<View style={{ height: 60 }} />
			</ScrollView>

			{/* Submission Overlay */}
			<Modal visible={isSubmitting} transparent animationType="fade">
				<View style={styles.submissionOverlay}>
					<View
						style={[
							styles.submissionContent,
							{ backgroundColor: theme.colors.card },
						]}
					>
						{submitProgress < 1 ? (
							<>
								<ActivityIndicator
									size="large"
									color={theme.colors.primary}
								/>
								<Text
									style={[
										styles.submissionTitle,
										{ color: theme.colors.text },
									]}
								>
									Submitting Report...
								</Text>
								<Text
									style={[
										styles.submissionSubtitle,
										{ color: theme.colors.textSecondary },
									]}
								>
									Please wait while we process your request
								</Text>
								<View
									style={[
										styles.progressBarContainer,
										{
											backgroundColor:
												theme.colors.inputBackground,
										},
									]}
								>
									<View
										style={[
											styles.progressBar,
											{
												backgroundColor:
													theme.colors.primary,
												width: `${submitProgress * 100}%`,
											},
										]}
									/>
								</View>
							</>
						) : (
							<>
								<View
									style={[
										styles.successCircle,
										{ backgroundColor: theme.colors.success },
									]}
								>
									<Ionicons
										name="checkmark"
										size={40}
										color="#fff"
									/>
								</View>
								<Text
									style={[
										styles.submissionTitle,
										{ color: theme.colors.text },
									]}
								>
									Report Submitted!
								</Text>
								<Text
									style={[
										styles.submissionSubtitle,
										{ color: theme.colors.textSecondary },
									]}
								>
									Redirecting to your reports...
								</Text>
							</>
						)}
					</View>
				</View>
			</Modal>

			{/* Evidence Help Modal */}
			<Modal
				visible={showEvidenceHelp}
				transparent
				animationType="fade"
				onRequestClose={() => setShowEvidenceHelp(false)}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setShowEvidenceHelp(false)}
				>
					<View
						style={[
							styles.modalContent,
							{ backgroundColor: theme.colors.card },
						]}
					>
						<View
							style={[
								styles.modalHeader,
								{ borderBottomColor: theme.colors.border },
							]}
						>
							<Ionicons
								name="information-circle"
								size={28}
								color={theme.colors.primary}
							/>
							<Text
								style={[
									styles.modalTitle,
									{ color: theme.colors.text },
								]}
							>
								Evidence Guidelines
							</Text>
							<TouchableOpacity
								onPress={() => setShowEvidenceHelp(false)}
							>
								<Ionicons
									name="close"
									size={24}
									color={theme.colors.textSecondary}
								/>
							</TouchableOpacity>
						</View>

						<View style={styles.modalBody}>
							<View style={styles.guidelineItem}>
								<Ionicons
									name="images"
									size={20}
									color={theme.colors.primary}
								/>
								<Text
									style={[
										styles.guidelineText,
										{ color: theme.colors.text },
									]}
								>
									Up to 5 images allowed
								</Text>
							</View>

							<View style={styles.guidelineItem}>
								<Ionicons
									name="videocam"
									size={20}
									color={theme.colors.primary}
								/>
								<Text
									style={[
										styles.guidelineText,
										{ color: theme.colors.text },
									]}
								>
									Or 1 video file
								</Text>
							</View>

							<View style={styles.guidelineItem}>
								<Ionicons
									name="document"
									size={20}
									color={theme.colors.primary}
								/>
								<Text
									style={[
										styles.guidelineText,
										{ color: theme.colors.text },
									]}
								>
									Maximum 100MB per file
								</Text>
							</View>

							<View
								style={[
									styles.guidelineDivider,
									{ backgroundColor: theme.colors.border },
								]}
							/>

							<Text
								style={[
									styles.guidelineTip,
									{ color: theme.colors.textSecondary },
								]}
							>
								<Text
									style={[
										styles.guidelineTipBold,
										{ color: theme.colors.text },
									]}
								>
									Tip:{' '}
								</Text>
								Clear photos showing the full context of the
								incident help authorities respond faster and more
								effectively.
							</Text>
						</View>
					</View>
				</TouchableOpacity>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8fafc',
	},

	// Selection Screen
	selectionContainer: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	selectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	selectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#1f2937',
	},
	backButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	categoryGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		padding: 16,
		gap: 12,
	},
	categoryCardLarge: {
		aspectRatio: 1,
		backgroundColor: '#ffffff',
		borderRadius: 20,
		padding: 24,
		alignItems: 'center',
		marginBottom: 16,
		shadowColor: '#6366f1',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 5,
		borderWidth: 2,
		borderColor: '#f1f5f9',
	},
	categoryIconCircle: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: '#f0f9ff',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	categoryIconLarge: {
		fontSize: 32,
	},
	categoryNameLarge: {
		fontSize: 15,
		fontWeight: '700',
		color: '#374151',
		textAlign: 'center',
	},

	// Form Screen Header
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 14,
		backgroundColor: '#ffffff',
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	headerBtn: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerCenter: {
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#111827',
	},
	headerSubtitle: {
		fontSize: 13,
		color: '#6b7280',
		marginTop: 2,
	},

	formScroll: {
		padding: 16,
	},

	card: {
		backgroundColor: '#ffffff',
		borderRadius: 16,
		padding: 20,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 3,
		borderWidth: 1,
		borderColor: '#f1f5f9',
	},

	// Selected Category Card
	categorySelectedCard: {
		backgroundColor: '#fefce8',
		borderColor: '#fde047',
		borderWidth: 2,
	},
	categoryBadge: {
		backgroundColor: '#fbbf24',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		alignSelf: 'flex-start',
		marginBottom: 12,
	},
	badgeText: {
		fontSize: 11,
		fontWeight: '700',
		color: '#78350f',
		letterSpacing: 0.5,
	},
	categoryHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	catInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
	},
	catIconContainer: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	catIcon: {
		fontSize: 28,
	},
	catName: {
		fontSize: 19,
		fontWeight: 'bold',
		color: '#111827',
	},
	catSubtext: {
		fontSize: 13,
		color: '#78350f',
		marginTop: 2,
	},
	changeBtn: {
		borderWidth: 2,
		borderColor: '#fbbf24',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: '#fff',
	},
	changeBtnText: {
		fontSize: 14,
		color: '#78350f',
		fontWeight: '600',
	},

	// Labels
	labelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	labelIcon: {
		marginRight: 8,
	},
	cardLabel: {
		fontSize: 15,
		fontWeight: '800',
		color: '#1e293b',
		letterSpacing: 0.5,
	},
	required: {
		fontSize: 18,
		color: '#ef4444',
		marginLeft: 6,
		fontWeight: 'bold',
	},
	optionalText: {
		fontSize: 12,
		color: '#64748b',
		marginLeft: 6,
		fontStyle: 'italic',
	},
	fieldDescription: {
		fontSize: 13,
		color: '#64748b',
		marginBottom: 14,
		lineHeight: 18,
	},

	// Inputs
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: '#e2e8f0',
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
		backgroundColor: '#f8fafc',
		minHeight: 54,
	},
	textInputFlex: {
		flex: 1,
		fontSize: 16,
		color: '#1f2937',
		paddingTop: 0,
		paddingBottom: 0,
	},
	textArea: {
		borderWidth: 2,
		borderColor: '#e2e8f0',
		borderRadius: 12,
		padding: 14,
		backgroundColor: '#f8fafc',
		fontSize: 16,
		color: '#1f2937',
		minHeight: 120,
	},
	charCount: {
		fontSize: 12,
		color: '#94a3b8',
		marginTop: 6,
		textAlign: 'right',
	},

	// Location Button
	currentLocBtn: {
		marginTop: 12,
		alignSelf: 'flex-start',
	},
	locationBtnContent: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#d1fae5',
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 20,
		gap: 6,
	},
	currentLocText: {
		fontSize: 14,
		color: '#047857',
		fontWeight: '600',
	},

	// Evidence Section
	evidenceHeader: {
		marginBottom: 12,
	},
	evidenceSubtitle: {
		fontSize: 13,
		color: '#64748b',
		marginTop: 4,
		lineHeight: 18,
	},
	helpIconBtn: {
		marginLeft: 8,
		padding: 2,
	},

	// Media Grid
	mediaGrid: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 16,
	},
	mediaCard: {
		flex: 1,
		borderRadius: 14,
		padding: 16,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 3,
	},
	cameraCard: {
		backgroundColor: '#3b82f6',
	},
	galleryCard: {
		backgroundColor: '#8b5cf6',
	},
	videoCard: {
		backgroundColor: '#ec4899',
	},
	mediaIconCircle: {
		marginBottom: 8,
	},
	mediaCardTitle: {
		fontSize: 14,
		fontWeight: '700',
		color: '#ffffff',
		marginBottom: 2,
	},
	mediaCardDesc: {
		textAlign: 'center',
		fontSize: 10,
		color: '#e0e7ff',
	},

	// Media Previews
	previewSection: {
		marginTop: 20,
	},
	previewHeader: {
		fontSize: 14,
		fontWeight: '600',
		color: '#475569',
		marginBottom: 12,
	},
	mediaScroll: {
		maxHeight: 120,
	},
	mediaPreviewItem: {
		width: 110,
		height: 110,
		marginRight: 12,
		borderRadius: 12,
		overflow: 'hidden',
		position: 'relative',
		backgroundColor: '#e5e7eb',
		borderWidth: 2,
		borderColor: '#cbd5e1',
	},
	previewImage: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	videoPlaceholder: {
		width: '100%',
		height: '100%',
		backgroundColor: '#1e293b',
		alignItems: 'center',
		justifyContent: 'center',
	},
	videoLabel: {
		color: '#fff',
		fontSize: 11,
		marginTop: 4,
		fontWeight: '600',
	},
	removeMediaBtn: {
		position: 'absolute',
		top: 4,
		right: 4,
		backgroundColor: '#fff',
		borderRadius: 13,
	},

	// Priority
	priorityRow: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 8,
	},
	priorityChip: {
		flex: 1,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: 'transparent',
	},
	prioritySelected: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.2,
		shadowRadius: 6,
		elevation: 4,
	},
	priorityIcon: {
		marginBottom: 4,
	},
	priorityText: {
		fontSize: 14,
		fontWeight: '700',
	},

	// Privacy Note
	privacyNote: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginTop: 8,
		backgroundColor: '#d1fae5',
		padding: 10,
		borderRadius: 8,
	},
	privacyText: {
		fontSize: 12,
		color: '#059669',
		fontWeight: '500',
	},

	// Submit Button
	submitBtn: {
		flexDirection: 'row',
		backgroundColor: '#10b981',
		borderRadius: 16,
		paddingVertical: 18,
		paddingHorizontal: 20,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#10b981',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.4,
		shadowRadius: 12,
		elevation: 6,
		marginTop: 10,
	},
	submitBtnText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#ffffff',
	},

	// Modal Styles
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalContent: {
		backgroundColor: '#ffffff',
		borderRadius: 20,
		width: '100%',
		maxWidth: 400,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
		elevation: 10,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#1f2937',
		flex: 1,
		marginLeft: 12,
	},
	modalBody: {
		padding: 20,
	},
	guidelineItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
		gap: 12,
	},
	guidelineText: {
		fontSize: 15,
		color: '#1f2937',
		fontWeight: '500',
	},
	guidelineDivider: {
		height: 1,
		backgroundColor: '#e5e7eb',
		marginVertical: 16,
	},
	guidelineTip: {
		fontSize: 13,
		color: '#64748b',
		lineHeight: 20,
	},
	guidelineTipBold: {
		fontWeight: '700',
		color: '#1f2937',
	},
	submissionOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
	},
	submissionContent: {
		width: '100%',
		padding: 32,
		borderRadius: 24,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.4,
		shadowRadius: 16,
		elevation: 15,
	},
	submissionTitle: {
		fontSize: 22,
		fontWeight: 'bold',
		marginTop: 20,
		textAlign: 'center',
	},
	submissionSubtitle: {
		fontSize: 15,
		marginTop: 8,
		textAlign: 'center',
		marginBottom: 24,
	},
	progressBarContainer: {
		width: '100%',
		height: 8,
		borderRadius: 4,
		overflow: 'hidden',
	},
	progressBar: {
		height: '100%',
		borderRadius: 4,
	},
	successCircle: {
		width: 80,
		height: 80,
		borderRadius: 40,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8,
	},
});

