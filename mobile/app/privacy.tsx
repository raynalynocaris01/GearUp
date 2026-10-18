import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>
          {`Last updated: ${new Date().toLocaleDateString()}`}
        </Text>

        <Text style={styles.paragraph}>
          GearUp respects your privacy and is committed to protecting the personal information of its users. This Privacy Policy explains how GearUp collects, uses, stores, and protects information when you use the GearUp website or mobile application.
        </Text>
        <Text style={styles.paragraph}>
          By using GearUp, you agree to the practices described in this Privacy Policy.
        </Text>

        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>GearUp may collect information that users provide when creating an account, making a booking, or using the platform. This may include:</Text>
        <Text style={styles.bullet}>• Full name</Text>
        <Text style={styles.bullet}>• Email address</Text>
        <Text style={styles.bullet}>• Contact number</Text>
        <Text style={styles.bullet}>• Account username and password</Text>
        <Text style={styles.bullet}>• Booking information</Text>
        <Text style={styles.bullet}>• Campsite reservation details</Text>
        <Text style={styles.bullet}>• Tour guide booking details</Text>
        <Text style={styles.bullet}>• Reviews and ratings</Text>
        <Text style={styles.bullet}>• Other information voluntarily provided by the user</Text>

        <Text style={styles.heading}>2. Information Collected Automatically</Text>
        <Text style={styles.paragraph}>When you use GearUp, the system may automatically collect certain technical information, such as:</Text>
        <Text style={styles.bullet}>• Device type</Text>
        <Text style={styles.bullet}>• Operating system</Text>
        <Text style={styles.bullet}>• Browser or application information</Text>
        <Text style={styles.bullet}>• Date and time of system access</Text>
        <Text style={styles.bullet}>• Basic usage information</Text>
        <Text style={styles.bullet}>• IP address, where applicable</Text>
        <Text style={styles.paragraph}>This information may be used to maintain, secure, and improve the GearUp system.</Text>

        <Text style={styles.heading}>3. How We Use Your Information</Text>
        <Text style={styles.paragraph}>GearUp may use collected information to:</Text>
        <Text style={styles.bullet}>• Create and manage user accounts.</Text>
        <Text style={styles.bullet}>• Process campsite bookings.</Text>
        <Text style={styles.bullet}>• Process tour guide bookings.</Text>
        <Text style={styles.bullet}>• Communicate with users regarding their bookings.</Text>
        <Text style={styles.bullet}>• Provide customer support.</Text>
        <Text style={styles.bullet}>• Display reviews and ratings.</Text>
        <Text style={styles.bullet}>• Improve the functionality and performance of the system.</Text>
        <Text style={styles.bullet}>• Maintain system security.</Text>
        <Text style={styles.bullet}>• Detect and prevent fraudulent or unauthorized activities.</Text>
        <Text style={styles.bullet}>• Provide important updates regarding the GearUp service.</Text>

        <Text style={styles.heading}>4. Sharing of Information</Text>
        <Text style={styles.paragraph}>GearUp may share necessary information with relevant service providers when required to complete a booking or provide a requested service.</Text>
        <Text style={styles.paragraph}>For example, information necessary for a campsite reservation may be shared with the applicable campsite owner or operator.</Text>
        <Text style={styles.paragraph}>Information necessary for a tour guide booking may be shared with the applicable tour guide.</Text>
        <Text style={styles.paragraph}>GearUp will not sell users' personal information to third parties.</Text>

        <Text style={styles.heading}>5. Reviews and Public Information</Text>
        <Text style={styles.paragraph}>If users submit reviews, ratings, or other content intended to be publicly displayed, that information may be visible to other GearUp users.</Text>
        <Text style={styles.paragraph}>Users should avoid including sensitive personal information in public reviews or other publicly accessible content.</Text>

        <Text style={styles.heading}>6. Payment Information</Text>
        <Text style={styles.paragraph}>If GearUp provides payment functionality, payment information may be processed through the applicable payment service provider.</Text>
        <Text style={styles.paragraph}>GearUp will only collect or retain payment information to the extent necessary for providing its services and processing transactions.</Text>
        <Text style={styles.paragraph}>Users should review the privacy policy of the applicable payment provider for information about how payment information is handled.</Text>

        <Text style={styles.heading}>7. Data Security</Text>
        <Text style={styles.paragraph}>GearUp takes reasonable measures to protect users' personal information from unauthorized access, disclosure, alteration, or destruction.</Text>
        <Text style={styles.paragraph}>However, no online system can guarantee complete security. Users are responsible for keeping their account credentials confidential and should notify GearUp if they believe their account has been compromised.</Text>

        <Text style={styles.heading}>8. Data Retention</Text>
        <Text style={styles.paragraph}>GearUp may retain personal information for as long as necessary to provide its services, maintain user accounts, process transactions, comply with applicable requirements, and resolve disputes.</Text>
        <Text style={styles.paragraph}>When information is no longer necessary, GearUp may delete or securely dispose of it in accordance with applicable policies and requirements.</Text>

        <Text style={styles.heading}>9. User Rights</Text>
        <Text style={styles.paragraph}>Subject to applicable laws and regulations, users may have the right to:</Text>
        <Text style={styles.bullet}>• Request access to their personal information.</Text>
        <Text style={styles.bullet}>• Request correction of inaccurate information.</Text>
        <Text style={styles.bullet}>• Request deletion of certain personal information.</Text>
        <Text style={styles.bullet}>• Withdraw consent where applicable.</Text>
        <Text style={styles.bullet}>• Ask how their personal information is being used.</Text>
        <Text style={styles.bullet}>• Raise concerns about the handling of their personal information.</Text>
        <Text style={styles.paragraph}>Users may contact GearUp using the contact information provided below to make a privacy-related request.</Text>

        <Text style={styles.heading}>10. Cookies and Similar Technologies</Text>
        <Text style={styles.paragraph}>GearUp may use cookies or similar technologies to help maintain user sessions, remember preferences, improve system functionality, and understand how users interact with the platform.</Text>
        <Text style={styles.paragraph}>Users may be able to control cookies through their browser or device settings.</Text>

        <Text style={styles.heading}>11. Children's Privacy</Text>
        <Text style={styles.paragraph}>GearUp is not intended to collect unnecessary personal information from children.</Text>
        <Text style={styles.paragraph}>If a user is below the applicable age for using a particular service, parental or guardian permission may be required.</Text>
        <Text style={styles.paragraph}>If GearUp becomes aware that personal information has been collected from a child without appropriate permission, reasonable steps may be taken to address the situation.</Text>

        <Text style={styles.heading}>12. Third-Party Services</Text>
        <Text style={styles.paragraph}>GearUp may use third-party services to support certain functions of the platform, such as payment processing, hosting, analytics, authentication, or communication.</Text>
        <Text style={styles.paragraph}>These third-party providers may process information according to their own privacy policies.</Text>

        <Text style={styles.heading}>13. Changes to This Privacy Policy</Text>
        <Text style={styles.paragraph}>GearUp may update this Privacy Policy from time to time to reflect changes to the system, services, or applicable requirements.</Text>
        <Text style={styles.paragraph}>The updated Privacy Policy will be made available through the GearUp platform.</Text>
        <Text style={styles.paragraph}>Users are encouraged to review this Privacy Policy periodically.</Text>

        <Text style={styles.heading}>14. Contact Us</Text>
        <Text style={styles.paragraph}>If you have questions, concerns, or requests regarding this Privacy Policy, you may contact:</Text>
        <Text style={styles.paragraph}>
          GearUp Support{'\n'}
          Email: gearupsystem@gmail.com{'\n'}
          Phone: {'\n'}
          Address: Metro Dumaguete College, E.J. Blanco Drive Extension, Daro, Dumaguete City, Negros Oriental 6200, Philippines.
        </Text>

        <Text style={styles.heading}>15. Consent</Text>
        <Text style={styles.paragraph}>By using GearUp, you acknowledge that you have read and understood this Privacy Policy and agree to the collection and use of your information as described above, subject to applicable laws and regulations.</Text>
        <Text style={[styles.paragraph, { fontWeight: 'bold', color: colors.gearupGreen }]}>GearUp - Camp. Explore. Adventure.</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  content: { padding: 20 },
  updated: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },
  heading: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 24, marginBottom: 8 },
  paragraph: { fontSize: 15, color: '#374151', lineHeight: 22, marginBottom: 12 },
  bullet: { fontSize: 15, color: '#374151', lineHeight: 22, marginLeft: 12, marginBottom: 6 },
});