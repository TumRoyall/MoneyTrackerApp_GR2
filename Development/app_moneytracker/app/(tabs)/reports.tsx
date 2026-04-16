import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type ToolItem = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
};

export default function ReportsScreen() {
  const router = useRouter();

  const tools: ToolItem[] = [
    {
      id: 'budgets',
      title: 'Ngân sách',
      description: 'Đặt ngân sách hằng ngày, hằng tuần hoặc hằng tháng để theo dõi chi tiêu của bạn',
      icon: 'chart-pie',
      onPress: () => router.push('/(tabs)/budgets'),
    },
    {
      id: 'saving',
      title: 'Tiết kiệm',
      description: 'Đặt mục tiêu tiết kiệm và theo dõi tiến trình tiết kiệm của bạn!',
      icon: 'piggy-bank',
      onPress: () => {},
    },
    {
      id: 'debt',
      title: 'Món nợ',
      description: 'Theo dõi các khoản nợ của bạn và nỗ lực trả hết chúng!',
      icon: 'card-bulleted-off',
      onPress: () => {},
    },
    {
      id: 'challenge',
      title: 'Thử thách',
      description: 'Cạnh tranh với bạn bè để tiết kiệm nhiều hơn và leo lên bảng xếp hạng.',
      icon: 'trophy-outline',
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Công cụ tiền tệ</Text>
        <Text style={styles.subtitle}>Chọn một công cụ để quản lý tài chính của bạn</Text>

        {tools.map((tool) => (
          <Pressable key={tool.id} style={styles.card} onPress={tool.onPress}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={tool.icon} size={30} color="#fff" />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{tool.title}</Text>
              <Text style={styles.cardDescription}>{tool.description}</Text>
            </View>

            <Ionicons name="chevron-forward" size={26} color="#1f1f1f" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7f9',
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },
  title: {
    marginTop: 4,
    fontSize: 40,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  subtitle: {
    marginTop: -4,
    marginBottom: 10,
    fontSize: 16,
    color: '#6c737a',
  },
  card: {
    minHeight: 112,
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2aa8b5',
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  cardDescription: {
    fontSize: 16,
    color: '#6a7279',
    lineHeight: 21,
  },
});
