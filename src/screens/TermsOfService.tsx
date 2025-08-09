import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '../styles/theme';
import { AuthStackParamList } from '../types/types';
//Navigation prop type
type TermsScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Terms'>;
type TermsScreenProps = {
  navigation: TermsScreenNavigationProp;
};

const TermsOfServiceScreen = ({ navigation }: TermsScreenProps) => {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>
      {/* ScrollView for scrollable terms content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.lastUpdated}>Last Updated: April 29, 2025</Text>
        
        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to PocketTrainer. Please read these Terms of Service ("Terms") carefully as they contain important 
          information about your legal rights, remedies, and obligations. By accessing or using the PocketTrainer 
          application ("App"), you agree to comply with and be bound by these Terms.
        </Text>
        
        <Text style={styles.sectionTitle}>2. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By downloading, installing, or using our App, you acknowledge that you have read, understood, and agree 
          to be bound by these Terms. If you do not agree to these Terms, please do not use the App.
        </Text>
        
        <Text style={styles.sectionTitle}>3. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these Terms at any time. We will provide notice of any material changes by 
          updating the "Last Updated" date at the top of these Terms. Your continued use of the App after such 
          modifications will constitute your acknowledgment and agreement to the modified Terms.
        </Text>
        
        <Text style={styles.sectionTitle}>4. App Description</Text>
        <Text style={styles.paragraph}>
          PocketTrainer is a fitness application designed to provide workout guidance, tracking capabilities, and 
          fitness-related information. The App is intended for informational and recreational purposes only.
        </Text>
        
        <Text style={styles.sectionTitle}>5. Disclaimer of Guarantees</Text>
        <Text style={styles.paragraphBold}>
          IMPORTANT NOTICE: POCKETTRAINER DOES NOT GUARANTEE RESULTS.
        </Text>
        <Text style={styles.paragraph}>
          The fitness information, workouts, routines, and advice provided through the App are for educational and 
          informational purposes only. Results from using our App will vary depending on individual factors including, 
          but not limited to, physical condition, effort, consistency, diet, and genetic factors.
        </Text>
        <Text style={styles.paragraph}>
          We make no guarantees, representations, or warranties, whether express or implied, that you will lose weight, 
          gain muscle, improve performance, or achieve any particular fitness results through the use of our App.
        </Text>
        
        <Text style={styles.sectionTitle}>6. User Accounts</Text>
        <Text style={styles.paragraph}>
          To use certain features of the App, you may need to create an account. You are responsible for maintaining 
          the confidentiality of your account information and for all activities that occur under your account. 
          You agree to:
        </Text>
        <Text style={styles.bulletPoint}>• Provide accurate and complete information</Text>
        <Text style={styles.bulletPoint}>• Update your information as necessary</Text>
        <Text style={styles.bulletPoint}>• Notify us immediately of any unauthorized use of your account</Text>
        
        <Text style={styles.sectionTitle}>7. Data Collection and Privacy</Text>
        <Text style={styles.paragraph}>
          We collect and process certain personal information as described in our Privacy Policy. By using the App, 
          you consent to such processing and you warrant that all data provided by you is accurate.
        </Text>
        
        <Text style={styles.sectionTitle}>8. User Content</Text>
        <Text style={styles.paragraph}>
          If our App allows you to post, upload, or submit content, you retain ownership of such content but grant 
          us a non-exclusive, royalty-free, worldwide license to use, store, display, reproduce, modify, and distribute 
          your content solely for the purpose of operating and improving our App.
        </Text>
        
        <Text style={styles.sectionTitle}>9. Prohibited Activities</Text>
        <Text style={styles.paragraph}>You agree not to:</Text>
        <Text style={styles.bulletPoint}>• Use the App for any illegal purpose or in violation of any laws</Text>
        <Text style={styles.bulletPoint}>• Interfere with or disrupt the operation of the App</Text>
        <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access to the App</Text>
        <Text style={styles.bulletPoint}>• Transmit any viruses, worms, or other malicious code</Text>
        <Text style={styles.bulletPoint}>• Use the App to harass, abuse, or harm others</Text>
        
        <Text style={styles.sectionTitle}>10. Intellectual Property Rights</Text>
        <Text style={styles.paragraph}>
          The App, including its content, features, and functionality, is owned by us and is protected by copyright, 
          trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any 
          part of our App without our prior written consent.
        </Text>
        
        <Text style={styles.sectionTitle}>11. Termination of Use</Text>
        <Text style={styles.paragraph}>
          We reserve the right to suspend or terminate your access to the App at any time and for any reason, 
          without notice or liability to you.
        </Text>
        
        <Text style={styles.sectionTitle}>12. Limitation of Liability</Text>
        <Text style={styles.paragraphCaps}>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY 
          OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
        </Text>
        <Text style={styles.bulletPoint}>• YOUR USE OR INABILITY TO USE THE APP</Text>
        <Text style={styles.bulletPoint}>• ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SERVERS AND/OR ANY PERSONAL INFORMATION STORED THEREIN</Text>
        <Text style={styles.bulletPoint}>• ANY BUGS, VIRUSES, OR OTHER MALICIOUS CODE THAT MAY BE TRANSMITTED TO OR THROUGH OUR APP</Text>
        <Text style={styles.bulletPoint}>• ANY CONTENT OR CONDUCT OF ANY THIRD PARTY ON THE APP</Text>
        
        <Text style={styles.sectionTitle}>13. Health Disclaimer</Text>
        <Text style={styles.paragraph}>
          The information provided by the App is not intended to diagnose, treat, cure, or prevent any disease. 
          Always consult with a qualified healthcare professional before beginning any exercise program or making 
          any changes to your diet or lifestyle, especially if you have or suspect you might have a health condition.
        </Text>
        
        <Text style={styles.sectionTitle}>14. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms shall be governed by and construed in accordance with the laws of United States of America, 
          without regard to its conflict of law provisions.
        </Text>
        
        <Text style={styles.sectionTitle}>15. Contact Us</Text>
        <Text style={styles.paragraph}>If you have any questions about these Terms, please contact us at:</Text>
        <Text style={styles.bulletPoint}>• Email: chrisefff@gmail.com </Text>
        
        <Text style={styles.sectionTitle}>16. Severability</Text>
        <Text style={styles.paragraph}>
          If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited 
          or eliminated to the minimum extent necessary so that the Terms will otherwise remain in full force and effect.
        </Text>
        
        <Text style={styles.sectionTitle}>17. Entire Agreement</Text>
        <Text style={styles.paragraph}>
          These Terms constitute the entire agreement between you and us regarding the App and supersede all prior 
          agreements and understandings, whether written or oral.
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
    width: 40, 
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
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    marginBottom: 15,
  },
  paragraphBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  paragraphCaps: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.text,
    marginBottom: 15,
    textTransform: 'uppercase',
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

export default TermsOfServiceScreen;
