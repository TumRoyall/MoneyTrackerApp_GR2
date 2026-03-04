import { colors } from "@/constants/colors";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const RESEND_SECONDS = 60;

export default function VerifyGuide() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // countdown 60s
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const openMail = () => {
    Linking.openURL("mailto:");
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;

    try {
      setLoading(true);
      // TODO: Implement resend verification API call
      // await resendVerifyApi(email);
      setMessage("Đã gửi lại email xác thực");
      setCooldown(RESEND_SECONDS);
    } catch {
      setMessage("Không thể gửi lại email. Vui lòng thử sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xác thực email</Text>

      <Text style={styles.desc}>Chúng tôi đã gửi email xác thực đến:</Text>

      <Text style={styles.email}>{email || "email của bạn"}</Text>

      <Text style={styles.desc}>
        Vui lòng mở email và bấm vào liên kết xác thực để kích hoạt tài khoản.
      </Text>

      {/* OPEN EMAIL */}
      <Pressable style={styles.primaryButton} onPress={openMail}>
        <Text style={styles.primaryText}>Mở email</Text>
      </Pressable>

      {/* RESEND */}
      <Pressable
        style={[styles.resendButton, cooldown > 0 && styles.resendDisabled]}
        onPress={handleResend}
        disabled={cooldown > 0 || loading}
      >
        <Text
          style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}
        >
          {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại email xác thực"}
        </Text>
      </Pressable>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {/* BACK TO LOGIN */}
      <Pressable onPress={() => router.replace("/(auth)/login")}>
        <Text style={styles.backLogin}>Quay lại đăng nhập</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  title: {
    fontSize: 26,
    fontFamily: "InterBold",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 16,
  },

  desc: {
    fontSize: 15,
    fontFamily: "InterRegular",
    textAlign: "center",
    marginBottom: 6,
    color: colors.text,
  },

  email: {
    fontSize: 15,
    fontFamily: "InterSemiBold",
    textAlign: "center",
    marginBottom: 16,
    color: colors.primary,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },

  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: "InterSemiBold",
  },

  resendButton: {
    marginTop: 16,
    alignItems: "center",
  },

  resendDisabled: {
    opacity: 0.6,
  },

  resendText: {
    fontSize: 14,
    fontFamily: "InterMedium",
    color: colors.primary,
  },

  resendTextDisabled: {
    color: colors.border,
  },

  message: {
    marginTop: 12,
    textAlign: "center",
    fontFamily: "InterRegular",
    color: colors.text,
  },

  backLogin: {
    marginTop: 28,
    textAlign: "center",
    fontFamily: "InterSemiBold",
    color: colors.primary,
  },
});
