import { executeSQL, fetchRows } from "@/db/init";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function DebugDatabaseScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Quick queries
  const quickQueries = [
    {
      label: "All Transactions",
      sql: "SELECT * FROM transactions ORDER BY date DESC LIMIT 50",
    },
    { label: "All Accounts", sql: "SELECT * FROM accounts" },
    { label: "All Categories", sql: "SELECT * FROM categories" },
    { label: "All Budgets", sql: "SELECT * FROM budgets" },
    { label: "User Profile", sql: "SELECT * FROM user_profiles" },
    {
      label: "Tables Info",
      sql: "SELECT name FROM sqlite_master WHERE type='table'",
    },
  ];

  const executeQuery = async (sql: string) => {
    setIsLoading(true);
    try {
      const trimmedSql = sql.trim().toUpperCase();

      if (trimmedSql.startsWith("SELECT")) {
        const data = await fetchRows(sql);
        setResults(data);
        Alert.alert("Success", `Found ${data.length} rows`);
      } else {
        const result = await executeSQL(sql);
        setResults([]);
        Alert.alert(
          "Success",
          `Query executed. Changes: ${result.changes || 0}`,
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Query failed");
      console.error("Query error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Database Debug Tool</Text>

      {/* Quick Queries */}
      <View style={styles.quickButtons}>
        {quickQueries.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickButton}
            onPress={() => {
              setQuery(item.sql);
              executeQuery(item.sql);
            }}
          >
            <Text style={styles.quickButtonText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Query Input */}
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Enter SQL query..."
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[styles.executeButton, isLoading && styles.disabledButton]}
        onPress={() => executeQuery(query)}
        disabled={isLoading}
      >
        <Text style={styles.executeButtonText}>
          {isLoading ? "Executing..." : "Execute Query"}
        </Text>
      </TouchableOpacity>

      {/* Results */}
      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>
          Results ({results.length} rows):
        </Text>
        {results.map((row, index) => (
          <View key={index} style={styles.resultRow}>
            <Text style={styles.resultIndex}>#{index + 1}</Text>
            <Text style={styles.resultText}>
              {JSON.stringify(row, null, 2)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 40,
  },
  quickButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 8,
  },
  quickButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  quickButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    minHeight: 100,
    textAlignVertical: "top",
    fontFamily: "monospace",
    fontSize: 12,
  },
  executeButton: {
    backgroundColor: "#34C759",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  executeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  resultRow: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  resultIndex: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  resultText: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "#333",
  },
});
