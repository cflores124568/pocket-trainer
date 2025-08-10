import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity, StatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '../styles/theme';
import { AuthStackParamList } from '../types/types';

type PrivacyScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Privacy'>;
type PrivacyScreenProps = {
  navigation: PrivacyScreenNavigationProp;
};

const PrivacyPolicyScreen = ({ navigation }: PrivacyScreenProps) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.lastUpdated}>Last Updated: April 29, 2025</Text>
        
        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          PocketTrainer ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
          how we collect, use, disclose, and safeguard your information when you use our mobile application 
          PocketTrainer (the "App").
        </Text>
        <Text style={styles.paragraph}>
          Please read this Privacy Policy carefully. By using the App, you consent to the collection, use, and 
          disclosure of your information as described in this Privacy Policy. If you do not agree with the terms 
          of this Privacy Policy, please do not access or use the App.
        </Text>
        
        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        
        <Text style={styles.subSectionTitle}>2.1 Personal Information</Text>
        <Text style={styles.paragraph}>
          We may collect personal information that you voluntarily provide to us when you:
        </Text>
        <Text style={styles.bulletPoint}>• Create an account</Text>
        <Text style={styles.bulletPoint}>• Fill out forms in the App</Text>
        <Text style={styles.bulletPoint}>• Correspond with us</Text>
        <Text style={styles.bulletPoint}>• Request customer support</Text>
        
        <Text style={styles.paragraph}>
          This information may include:
        </Text>
        <Text style={styles.bulletPoint}>• Name</Text>
        <Text style={styles.bulletPoint}>• Email address</Text>
        <Text style={styles.bulletPoint}>• Age</Text>
        <Text style={styles.bulletPoint}>• Gender</Text>
        <Text style={styles.bulletPoint}>• Height and weight</Text>
        <Text style={styles.bulletPoint}>• Fitness goals</Text>
        
        <Text style={styles.subSectionTitle}>2.2 Automatically Collected Information</Text>
        <Text style={styles.paragraph}>
          When you use our App, we may automatically collect certain information, including:
        </Text>
        <Text style={styles.bulletPoint}>• Device information (model, operating system, unique device identifiers)</Text>
        <Text style={styles.bulletPoint}>• IP address</Text>
        <Text style={styles.bulletPoint}>• App usage data</Text>
        <Text style={styles.bulletPoint}>• Time and date of your use of the App</Text>
        <Text style={styles.bulletPoint}>• Other diagnostic data</Text>
        
        <Text style={styles.subSectionTitle}>2.3 Fitness and Activity Data</Text>
        <Text style={styles.paragraph}>
          Depending on how you use our App and the permissions you grant, we may collect:
        </Text>
        <Text style={styles.bulletPoint}>• Workout data (exercises, sets, reps, weights)</Text>
        <Text style={styles.bulletPoint}>• Activity metrics</Text>
        <Text style={styles.bulletPoint}>• Progress measurements</Text>
        <Text style={styles.bulletPoint}>• Goals and achievements</Text>
        
        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the information we collect for various purposes, including to:
        </Text>
        <Text style={styles.bulletPoint}>• Create and manage your account</Text>
        <Text style={styles.bulletPoint}>• Provide and maintain our App</Text>
        <Text style={styles.bulletPoint}>• Personalize your experience</Text>
        <Text style={styles.bulletPoint}>• Analyze usage patterns and improve the App</Text>
        <Text style={styles.bulletPoint}>• Communicate with you</Text>
        <Text style={styles.bulletPoint}>• Respond to your inquiries and provide customer support</Text>
        <Text style={styles.bulletPoint}>• Send you technical notices, updates, and administrative messages</Text>
        <Text style={styles.bulletPoint}>• Protect the security and integrity of our App</Text>
        
        <Text style={styles.sectionTitle}>4. Firebase and Data Storage</Text>
        <Text style={styles.paragraph}>
          PocketTrainer uses Google Firebase for data storage and authentication. Your information is stored on 
          Firebase's secure servers according to their security protocols and practices. We use Firebase to:
        </Text>
        <Text style={styles.bulletPoint}>• Authenticate users</Text>
        <Text style={styles.bulletPoint}>• Store user profiles and preferences</Text>
        <Text style={styles.bulletPoint}>• Store workout and fitness data</Text>
        <Text style={styles.bulletPoint}>• Synchronize data across devices</Text>
        
        <Text style={styles.paragraph}>
          Firebase collects and processes data according to Google's Privacy Policy. We encourage you to review 
          Google's Privacy Policy for more information about how they handle your data.
        </Text>
        
        <Text style={styles.sectionTitle}>5. Data Retention</Text>
        <Text style={styles.paragraph}>
          We will retain your personal information only for as long as is necessary for the purposes set out in 
          this Privacy Policy. We will retain and use your information to the extent necessary to comply with our 
          legal obligations, resolve disputes, and enforce our policies.
        </Text>
        <Text style={styles.paragraph}>
          If you delete your account, your personal information will be deleted or anonymized, except where 
          necessary to comply with legal obligations.
        </Text>
        
        <Text style={styles.sectionTitle}>6. Data Security</Text>
        <Text style={styles.paragraph}>
          We have implemented appropriate technical and organizational security measures designed to protect the 
          security of any personal information we process. However, despite our safeguards and efforts to secure 
          your information, no electronic transmission over the Internet or information storage technology can be 
          guaranteed to be 100% secure.
        </Text>
        
        <Text style={styles.sectionTitle}>7. Your Data Rights</Text>
        <Text style={styles.paragraph}>
          Depending on your location, you may have certain rights regarding your personal information, including:
        </Text>
        <Text style={styles.bulletPoint}>• Right to access the information we have about you</Text>
        <Text style={styles.bulletPoint}>• Right to correct inaccurate or incomplete information</Text>
        <Text style={styles.bulletPoint}>• Right to delete your personal information</Text>
        <Text style={styles.bulletPoint}>• Right to restrict or object to our processing of your information</Text>
        <Text style={styles.bulletPoint}>• Right to data portability</Text>
        
        <Text style={styles.paragraph}>
          To exercise these rights, please contact us using the information provided in the "Contact Us" section.
        </Text>
        
        <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our App is not intended for children under the age of 13. We do not knowingly collect personally identifiable 
          information from children under 13. If you are a parent or guardian and you are aware that your child has 
          provided us with personal information, please contact us so that we can take necessary actions.
        </Text>
        
        <Text style={styles.sectionTitle}>9. Changes to This Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
          Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy 
          Policy periodically for any changes.
        </Text>
        
        <Text style={styles.sectionTitle}>10. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          Our App may contain links to third-party websites or services that are not owned or controlled by us. 
          We have no control over and assume no responsibility for the content, privacy policies, or practices of 
          any third-party websites or services.
        </Text>
        
        <Text style={styles.sectionTitle}>11. Analytics</Text>
        <Text style={styles.paragraph}>
          We may use third-party Service Providers to monitor and analyze the use of our App, such as:
        </Text>
        <Text style={styles.bulletPoint}>• Google Analytics</Text>
        <Text style={styles.bulletPoint}>• Firebase Analytics</Text>
        
        <Text style={styles.paragraph}>
          These services collect information sent by your device and our App usage and performance data. This helps 
          us improve user experience and identify issues.
        </Text>
        
        <Text style={styles.sectionTitle}>12. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy or our data practices, please contact us at:
        </Text>
        <Text style={styles.bulletPoint}>• Email: chrisefff@gmail.com</Text>
        
        <Text style={styles.sectionTitle}>13. Consent</Text>
        <Text style={styles.paragraph}>
          By using our App, you consent to our Privacy Policy and agree to its terms. If you do not agree with this 
          policy, please do not use our App.
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            PocketTrainer © 2025. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40, // To balance the header
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    marginBottom: 15,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    paddingLeft: 15,
    marginBottom: 5,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

export default PrivacyPolicyScreen;
