import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms and Conditions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>
          {`Last updated: ${new Date().toLocaleDateString()}`}
        </Text>

        <Text style={styles.paragraph}>
          Welcome to GearUp, an outdoor adventure management system that connects campers and outdoor enthusiasts with campsite owners, campsite operators, and local tour guides.
        </Text>
        <Text style={styles.paragraph}>
          By accessing or using GearUp through its website or mobile application, you agree to these Terms and Conditions.
        </Text>

        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By creating an account, browsing the platform, making a campsite booking, hiring a local tour guide, or using any other GearUp service, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
        </Text>

        <Text style={styles.heading}>2. Eligibility</Text>
        <Text style={styles.paragraph}>Users must provide accurate and complete information when creating an account or making a booking.</Text>
        <Text style={styles.paragraph}>Users are responsible for maintaining the confidentiality of their account information and for all activities performed through their account.</Text>
        <Text style={styles.paragraph}>If a user is below the required age for a particular service, permission or supervision from a parent or legal guardian may be required.</Text>

        <Text style={styles.heading}>3. GearUp Services</Text>
        <Text style={styles.paragraph}>GearUp provides a platform where users may:</Text>
        <Text style={styles.bullet}>• Book campsites.</Text>
        <Text style={styles.bullet}>• Hire local tour guides.</Text>
        <Text style={styles.bullet}>• View camping locations and destination information.</Text>
        <Text style={styles.bullet}>• View campsite information and availability.</Text>
        <Text style={styles.bullet}>• Read campsite reviews and ratings.</Text>
        <Text style={styles.paragraph}>GearUp connects campers and outdoor enthusiasts with campsite owners, campsite operators, and local tour guides.</Text>

        <Text style={styles.heading}>4. User Responsibilities</Text>
        <Text style={styles.paragraph}>Users agree to:</Text>
        <Text style={styles.bullet}>• Provide truthful and accurate information.</Text>
        <Text style={styles.bullet}>• Use GearUp only for lawful purposes.</Text>
        <Text style={styles.bullet}>• Follow campsite rules and regulations.</Text>
        <Text style={styles.bullet}>• Follow reasonable instructions provided by campsite operators and tour guides.</Text>
        <Text style={styles.bullet}>• Arrive at booked locations at the agreed time.</Text>
        <Text style={styles.bullet}>• Pay applicable booking fees and charges.</Text>
        <Text style={styles.bullet}>• Respect campsite operators, tour guides, and other users.</Text>
        <Text style={styles.bullet}>• Respect the environment and local communities.</Text>

        <Text style={styles.heading}>5. Campsite and Tour Guide Responsibilities</Text>
        <Text style={styles.paragraph}>Campsite owners, campsite operators, and local tour guides using GearUp are responsible for providing accurate information about their services, including: Location, Availability, Prices, Schedules, Rules and requirements, and Services offered.</Text>
        <Text style={styles.paragraph}>Service providers are responsible for fulfilling confirmed bookings and providing services according to their stated policies.</Text>

        <Text style={styles.heading}>6. Bookings and Reservations</Text>
        <Text style={styles.paragraph}>Users may make campsite reservations and book tour guide services through GearUp.</Text>
        <Text style={styles.paragraph}>A booking is considered confirmed only when the system indicates that the reservation has been successfully completed.</Text>
        <Text style={styles.paragraph}>Users are responsible for reviewing booking information before confirming a reservation.</Text>
        <Text style={styles.paragraph}>GearUp may charge applicable booking or service fees, which will be displayed before the transaction is completed.</Text>

        <Text style={styles.heading}>7. Cancellation and Refunds</Text>
        <Text style={styles.paragraph}>Cancellation and refund policies may vary depending on the campsite or tour guide.</Text>
        <Text style={styles.paragraph}>Users should review the applicable cancellation and refund policy before confirming a booking.</Text>
        <Text style={styles.paragraph}>Where applicable, refunds will be processed according to the service provider's stated policy and GearUp's procedures.</Text>

        <Text style={styles.heading}>8. Tour Guide Services</Text>
        <Text style={styles.paragraph}>Local tour guides listed on GearUp are responsible for providing the services described in their listings.</Text>
        <Text style={styles.paragraph}>Users must follow reasonable instructions provided by tour guides during the service.</Text>
        <Text style={styles.paragraph}>GearUp does not guarantee the quality, availability, or suitability of every tour guide service listed on the platform.</Text>

        <Text style={styles.heading}>9. Payments and Fees</Text>
        <Text style={styles.paragraph}>GearUp may generate revenue through booking fees, premium listings, and advertisements.</Text>
        <Text style={styles.paragraph}>Users agree to pay all applicable booking fees and other charges displayed during a transaction.</Text>
        <Text style={styles.paragraph}>All payment information provided by users must be accurate and authorized.</Text>

        <Text style={styles.heading}>10. Reviews and User-Generated Content</Text>
        <Text style={styles.paragraph}>Users may submit reviews, ratings, comments, photos, or other content where these features are available.</Text>
        <Text style={styles.paragraph}>Users must ensure that submitted content is truthful, relevant, and does not contain unlawful, abusive, misleading, or inappropriate material.</Text>
        <Text style={styles.paragraph}>GearUp may remove content that violates these Terms and Conditions.</Text>

        <Text style={styles.heading}>11. Privacy and Personal Information</Text>
        <Text style={styles.paragraph}>GearUp may collect information necessary to provide its services, such as account information, booking information, and transaction details.</Text>
        <Text style={styles.paragraph}>Personal information will be handled according to GearUp's applicable Privacy Policy and data-protection requirements.</Text>
        <Text style={styles.paragraph}>Users should avoid publicly sharing sensitive personal information through reviews, comments, or other platform features.</Text>

        <Text style={styles.heading}>12. Accuracy of Information</Text>
        <Text style={styles.paragraph}>GearUp aims to provide accurate information about campsites, tour guides, and destinations.</Text>
        <Text style={styles.paragraph}>However, information may be provided or updated by campsite operators, tour guides, or other authorized users.</Text>
        <Text style={styles.paragraph}>GearUp does not guarantee that all information will always be complete, accurate, or current.</Text>

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