import { Ionicons } from '@expo/vector-icons';
import { PieChart, PiggyBank, CreditCard, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type ToolItem = {
  id: string;
  title: string;
  description: string;
  IconComponent: React.ComponentType<{ size: number; color: string }>;
  onPress: () => void;
};

const ToolIcon = ({ id, size, color }: { id: string; size: number; color: string }) => {
  switch (id) {
    case 'budgets':
      return <PieChart size={size} color={color} />;
    case 'saving':
      return <PiggyBank size={size} color={color} />;
    case 'debt':
      return <CreditCard size={size} color={color} />;
    case 'events':
      return <Calendar size={size} color={color} />;
    default:
      return <PieChart size={size} color={color} />;
  }
};

export default function ToolsScreen() {
  const router = useRouter();

  const tools: ToolItem[] = [
    {
      id: 'budgets',
      title: 'Ngân sách',
      description: 'Đặt ngân sách hằng ngày, hằng tuần hoặc hằng tháng để theo dõi chi tiêu của bạn',
      IconComponent: PieChart,
      onPress: () => router.push('/tools/budgets'),
    },
    {
      id: 'saving',
      title: 'Tiết kiệm',
      description: 'Đặt mục tiêu tiết kiệm và theo dõi tiến trình tiết kiệm của bạn!',
      IconComponent: PiggyBank,
      onPress: () => router.push('/tools/savings'),
    },
    {
      id: 'debt',
      title: 'Món nợ',
      description: 'Theo dõi các khoản nợ của bạn và nỗ lực trả hết chúng!',
      IconComponent: CreditCard,
      onPress: () => router.push('/tools/debts'),
    },
    {
      id: 'events',
      title: 'Sự kiện',
      description: 'Cùng bạn bè ghi nhận chi tiêu chung cho các sự kiện: cầu lông, sinh nhật, du lịch...',
      IconComponent: Calendar,
      onPress: () => router.push('/tools/events'),
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
              <tool.IconComponent size={30} color="#fff" />
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
    fontSize: 30,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  subtitle: {
    marginTop: -4,
    marginBottom: 10,
    fontSize: 14,
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
    fontSize: 22,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  cardDescription: {
    fontSize: 13,
    color: '#6a7279',
    lineHeight: 18,
  },
});
