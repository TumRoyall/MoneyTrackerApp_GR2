import { colors } from "@/constants/colors";
import { loginApi } from "@/services/auth.api";
import { saveToken } from "@/services/auth.storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {

  try {
    const res = await loginApi({ email, password });

    await saveToken(res.data.token);
    router.replace("/(tabs)");
  } catch (e) {
    setError("Email hoặc mật khẩu không đúng");
  }
};


  return (
    <View style={styles.container}>
      {/* HERO */}
      <View style={styles.hero}>
        <Image
          source={require("@/assets/images/login-hero.jpg")}
          style={styles.heroImage}
          resizeMode="contain"
        />
        <Text style={styles.slogan}>
          Quản lý tiền thông minh – An tâm mỗi ngày
        </Text>
      </View>

      {/* FORM */}
      <View style={styles.form}>
        <Text style={styles.title}>Đăng nhập</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#7A8A7F"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder="Mật khẩu"
          placeholderTextColor="#7A8A7F"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Đăng nhập</Text>
        </Pressable>

        <Text style={styles.registerText}>
          Chưa có tài khoản?{" "}
          <Text
            style={styles.link}
            onPress={() => router.push("/register")}
          >
            Đăng ký
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  hero: {
    flex: 1.1,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  heroImage: {
    width: "85%",
    height: 220,
  },

  slogan: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "InterRegular",
    color: colors.white,
  },

  form: {
    flex: 1,
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontFamily: "InterBold",
    color: colors.primary,
    marginBottom: 24,
  },

  input: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    fontSize: 15,
    fontFamily: "InterRegular",
  },

  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },

  buttonText: {
    fontSize: 16,
    fontFamily: "InterSemiBold",
    color: colors.white,
  },

  error: {
    fontSize: 13,
    fontFamily: "InterRegular",
    color: "#D9534F",
    marginBottom: 8,
  },

  registerText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "InterRegular",
    color: colors.text,
  },

  link: {
    fontFamily: "InterSemiBold",
    color: colors.primary,
  },
});
