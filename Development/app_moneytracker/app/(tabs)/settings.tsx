import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';

import { queryAll, executeSql } from '@/core/db/sqlite';
import { useAuthUsecases } from '@/modules/auth/usecases';

const USERNAME_KEY = 'display_username';

export default function SettingsScreen() {
  const { logout } = useAuthUsecases();
  const [username, setUsername] = useState('Người dùng');
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [devQuery, setDevQuery] = useState('SELECT * FROM sqlite_master;');
  const [queryResult, setQueryResult] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    loadUsername();
  }, []);

  const loadUsername = async () => {
    try {
      const savedName = await SecureStore.getItemAsync(USERNAME_KEY);
      if (savedName) {
        setUsername(savedName);
      }
      
      const savedAvatar = await SecureStore.getItemAsync('user_avatar');
      if (savedAvatar) {
        setAvatarUri(savedAvatar);
      }
    } catch (e) {
      console.log('Error loading username', e);
    }
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống');
      return;
    }
    try {
      await SecureStore.setItemAsync(USERNAME_KEY, tempName.trim());
      setUsername(tempName.trim());
      setIsEditing(false);
    } catch (e) {
      console.log('Error saving username', e);
      Alert.alert('Lỗi', 'Không thể lưu tên');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setAvatarUri(uri);
        await SecureStore.setItemAsync('user_avatar', uri);
      }
    } catch (e) {
      console.log('Error picking image:', e);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch (e) {
            Alert.alert('Lỗi', 'Đăng xuất thất bại');
          }
        },
      },
    ]);
  };

  const handleExecuteQuery = async () => {
    if (!devQuery.trim()) return;
    setIsQuerying(true);
    setQueryResult('');
    try {
      const trimmedQuery = devQuery.trim().toUpperCase();
      let result;
      if (trimmedQuery.startsWith('SELECT')) {
        result = await queryAll(devQuery);
      } else {
        result = await executeSql(devQuery);
      }
      setQueryResult(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setQueryResult(`Lỗi: ${error?.message || error}`);
    } finally {
      setIsQuerying(false);
    }
  };

  const renderSettingItem = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    onPress: () => void,
    color = '#333',
    showArrow = true
  ) => (
    <Pressable
      style={({ pressed }) => [styles.settingItem, pressed && styles.settingItemPressed]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.settingTitle, { color }]}>{title}</Text>
      {showArrow && <Ionicons name="chevron-forward" size={20} color="#ccc" />}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Section */}
          <View style={styles.header}>
            <Pressable onPress={pickImage} style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
              )}
              <View style={styles.avatarEditIcon}>
                <MaterialIcons name="photo-camera" size={12} color="#fff" />
              </View>
            </Pressable>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Xin chào,</Text>
              {isEditing ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={tempName}
                    onChangeText={setTempName}
                    autoFocus
                    placeholder="Nhập tên của bạn"
                  />
                  <Pressable onPress={handleSaveName} style={styles.actionBtn}>
                    <Ionicons name="checkmark-circle" size={26} color="#2bbcc5" />
                  </Pressable>
                  <Pressable onPress={() => setIsEditing(false)} style={styles.actionBtn}>
                    <Ionicons name="close-circle" size={26} color="#e14343" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.editRow}>
                  <Text style={styles.username}>{username}</Text>
                  <Pressable
                    onPress={() => {
                      setTempName(username);
                      setIsEditing(true);
                    }}
                    style={styles.editBtn}
                  >
                    <MaterialIcons name="edit" size={18} color="#2bbcc5" />
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {/* Settings Group */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tài khoản & Bảo mật</Text>
            <View style={styles.card}>
              {renderSettingItem('person-outline', 'Cài đặt tài khoản', () => {})}
              <View style={styles.divider} />
              {renderSettingItem('swap-horizontal-outline', 'Đổi tài khoản', () => {})}
              <View style={styles.divider} />
              {renderSettingItem('shield-checkmark-outline', 'Quyền riêng tư', () => {})}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Khác</Text>
            <View style={styles.card}>
              {renderSettingItem('notifications-outline', 'Thông báo', () => {})}
              <View style={styles.divider} />
              {renderSettingItem('help-circle-outline', 'Trợ giúp & Hỗ trợ', () => {})}
              <View style={styles.divider} />
              {renderSettingItem('log-out-outline', 'Đăng xuất', handleLogout, '#e14343', false)}
            </View>
          </View>

          {/* Developer Tools */}
          <View style={styles.section}>
            <Text style={styles.devSectionTitle}>🛠 Dành cho Nhà phát triển (SQLite)</Text>
            <View style={styles.devCard}>
              <Text style={styles.devLabel}>Nhập câu lệnh SQL:</Text>
              <TextInput
                style={styles.devInput}
                multiline
                numberOfLines={3}
                value={devQuery}
                onChangeText={setDevQuery}
                autoCapitalize="none"
              />
              <Pressable
                style={[styles.devBtn, isQuerying && styles.devBtnDisabled]}
                onPress={handleExecuteQuery}
                disabled={isQuerying}
              >
                <Text style={styles.devBtnText}>
                  {isQuerying ? 'Đang thực thi...' : 'Thực thi Query'}
                </Text>
              </Pressable>

              {queryResult ? (
                <View style={styles.resultContainer}>
                  <Text style={styles.devLabel}>Kết quả:</Text>
                  <ScrollView style={styles.resultScroll} nestedScrollEnabled>
                    <Text style={styles.resultText}>{queryResult}</Text>
                  </ScrollView>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2bbcc5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    backgroundColor: '#333',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#7a7a7a',
    marginBottom: 4,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  nameInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2bbcc5',
    paddingVertical: 4,
    marginRight: 8,
  },
  editBtn: {
    marginLeft: 10,
    padding: 4,
    backgroundColor: '#2bbcc520',
    borderRadius: 8,
  },
  actionBtn: {
    padding: 4,
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7a7a7a',
    marginBottom: 10,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  settingItemPressed: {
    backgroundColor: '#f2f2f2',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 60,
    marginRight: 12,
  },
  devSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e68a00',
    marginBottom: 10,
    marginLeft: 8,
  },
  devCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffd699',
  },
  devLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  devInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  devBtn: {
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  devBtnDisabled: {
    opacity: 0.6,
  },
  devBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  resultScroll: {
    backgroundColor: '#282c34',
    borderRadius: 12,
    padding: 12,
    maxHeight: 250,
  },
  resultText: {
    color: '#abb2bf',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
});
