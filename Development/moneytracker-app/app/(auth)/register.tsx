import { colors } from "@/constants/colors";
import { checkEmailApi, registerApi } from "@/services/auth.api";
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

/* ===== Utils ===== */
const emailRegex = /^[^\s@]+@gmail\.com$/;

const Check = () => <Text style={styles.check}>✓</Text>;

export default function Register() {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // validate state
  const [fullNameValid, setFullNameValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);

  /* ===== Password rules ===== */
  const hasMinLength = (pw: string) => pw.length >= 8;
  const hasLetter = (pw: string) => /[A-Za-z]/.test(pw);
  const hasNumber = (pw: string) => /\d/.test(pw);

  /* ===== Handlers ===== */
  const onFullnameChange = (text: string) => {
    setFullname(text);
    setFullNameValid(text.trim().length > 0);
  };

  const onEmailBlur = async () => {
    if (!emailRegex.test(email)) {
      setEmailValid(false);
      setError("Email phải có dạng @gmail.com");
      return;
    }

    try {
      setEmailChecking(true);
      setError("");
      await checkEmailApi(email);
      setEmailValid(true);
    } catch (err: any) {
      setEmailValid(false);
      setError(err.message || "Email đã tồn tại");
    } finally {
      setEmailChecking(false);
    }
  };

  const onPasswordChange = (text: string) => {
    setPassword(text);

    const ok =
      hasMinLength(text) &&
      hasLetter(text) &&
      hasNumber(text);

    setPasswordValid(ok);
  };

  const canSubmit =
    fullNameValid &&
    emailValid &&
    passwordValid &&
    password === confirm &&
    !loading;

  const handleRegister = () => {
    if (!canSubmit) {
      setError("Vui lòng nhập đầy đủ và đúng thông tin");
      return;
    }

    setError("");

    // 1. CHUYỂN TRANG NGAY
    router.replace({
      pathname: "/(auth)/verify-guide",
      params: { email },
    });

    // 2. GỌI API Ở NỀN (KHÔNG AWAIT)
    registerApi(email, password, fullname).catch((err) => {
      // không setState vì đã rời trang
      console.log("Register API error:", err);
    });
  };



  /* ===== UI ===== */
  return (
    <View style={styles.container}>
      {/* HERO */}
      <View style={styles.hero}>
        <Image
          source={require("@/assets/images/login-hero.jpg")}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>

      {/* FORM */}
      <View style={styles.form}>
        <Text style={styles.title}>Đăng ký</Text>

        {/* Full name */}
        <View style={styles.field}>
          <TextInput
            placeholder="Họ và tên"
            value={fullname}
            onChangeText={onFullnameChange}
            style={[
              styles.input,
              fullNameValid && styles.inputValid,
            ]}
          />
          {fullNameValid && <Check />}
        </View>

        {/* Email */}
        <View style={styles.field}>
          <TextInput
            placeholder="Email (@gmail.com)"
            value={email}
            onChangeText={setEmail}
            onBlur={onEmailBlur}
            autoCapitalize="none"
            style={[
              styles.input,
              emailValid && styles.inputValid,
            ]}
          />
          {emailValid && <Check />}
        </View>

        {emailChecking && (
          <Text style={styles.hint}>Đang kiểm tra email…</Text>
        )}

        {/* Password */}
        <View style={styles.field}>
          <TextInput
            placeholder="Mật khẩu"
            secureTextEntry
            value={password}
            onChangeText={onPasswordChange}
            style={[
              styles.input,
              passwordValid && styles.inputValid,
            ]}
          />
          {passwordValid && <Check />}
        </View>

        {/* Password rules */}
        {!passwordValid && password.length > 0 && (
          <View style={styles.passwordHint}>
            <Text
              style={[
                styles.rule,
                hasMinLength(password) && styles.ruleOk,
              ]}
            >
              • Ít nhất 8 ký tự
            </Text>
            <Text
              style={[
                styles.rule,
                hasLetter(password) && styles.ruleOk,
              ]}
            >
              • Có ít nhất 1 chữ cái
            </Text>
            <Text
              style={[
                styles.rule,
                hasNumber(password) && styles.ruleOk,
              ]}
            >
              • Có ít nhất 1 chữ số
            </Text>
          </View>
        )}

        {/* Confirm */}
        <View style={styles.field}>
          <TextInput
            placeholder="Nhập lại mật khẩu"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            style={[
              styles.input,
              confirm === password && confirm && styles.inputValid,
            ]}
          />
          {confirm === password && confirm && <Check />}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, !canSubmit && { opacity: 0.5 }]}
          disabled={!canSubmit}
          onPress={handleRegister}
        >
          <Text style={styles.buttonText}>
            {loading ? "Đang xử lý..." : "Tạo tài khoản"}
          </Text>
        </Pressable>

        <Text style={styles.loginText}>
          Đã có tài khoản?{" "}
          <Text
            style={styles.link}
            onPress={() => router.replace("/(auth)/login")}
          >
            Đăng nhập
          </Text>
        </Text>
      </View>
    </View>
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  hero: {
    flex: 1,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  heroImage: {
    width: "80%",
    height: 200,
  },

  form: {
    flex: 1.3,
    padding: 24,
  },

  title: {
    fontSize: 26,
    fontFamily: "InterBold",
    color: colors.primary,
    marginBottom: 20,
  },

  field: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  input: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    fontFamily: "InterRegular",
  },

  inputValid: {
    borderColor: "#2E7D32",
    backgroundColor: "#F1F8F4",
  },

  check: {
    marginLeft: 10,
    fontSize: 20,
    color: "#2E7D32",
    fontFamily: "InterBold",
  },

  passwordHint: {
    marginBottom: 10,
    marginLeft: 4,
  },

  rule: {
    fontSize: 13,
    color: "#999",
    fontFamily: "InterRegular",
    marginBottom: 2,
  },

  ruleOk: {
    color: "#2E7D32",
    fontFamily: "InterMedium",
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
    color: "#D9534F",
    marginBottom: 6,
    fontFamily: "InterRegular",
  },

  hint: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },

  loginText: {
    marginTop: 20,
    textAlign: "center",
    fontFamily: "InterRegular",
    color: colors.text,
  },

  link: {
    fontFamily: "InterSemiBold",
    color: colors.primary,
  },
});
