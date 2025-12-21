/**
 * Composant de test Firebase
 * Affiche le statut de connexion Firebase
 */

import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { auth, firestore } from "../config/firebase";

// ============================================================
// TYPES
// ============================================================

type ConnectionStatus = "loading" | "connected" | "error";

interface FirebaseStatusResult {
  auth: boolean;
  firestore: boolean;
  errorMessage?: string;
}

// ============================================================
// COMPOSANT
// ============================================================

export function FirebaseStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("loading");
  const [result, setResult] = useState<FirebaseStatusResult | null>(null);

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const testFirebaseConnection = async () => {
    console.log("🔥 Test Firebase Connection...");
    
    const testResult: FirebaseStatusResult = {
      auth: false,
      firestore: false,
    };

    try {
      // Test Auth
      const currentUser = auth().currentUser;
      console.log("✅ Auth initialisé, user:", currentUser?.email || "Non connecté");
      testResult.auth = true;

      // Test Firestore
      await firestore().collection("_healthcheck").doc("test").get();
      console.log("✅ Firestore accessible");
      testResult.firestore = true;

      setResult(testResult);
      setStatus("connected");
    } catch (error: any) {
      console.error("❌ Erreur Firebase:", error.message);
      testResult.errorMessage = error.message;
      setResult(testResult);
      
      // Si Auth fonctionne mais pas Firestore (permission denied), c'est quand même OK
      if (testResult.auth && error.code === "firestore/permission-denied") {
        setStatus("connected");
      } else {
        setStatus("error");
      }
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (status === "loading") {
    return (
      <View className="bg-gray-100 rounded-xl p-4 mx-4 my-2">
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#EC4899" />
          <Text className="ml-3 text-gray-600">Test Firebase en cours...</Text>
        </View>
      </View>
    );
  }

  if (status === "error" && !result?.auth) {
    return (
      <View className="bg-red-100 rounded-xl p-4 mx-4 my-2 border border-red-300">
        <View className="flex-row items-center mb-2">
          <Text className="text-2xl">❌</Text>
          <Text className="ml-3 text-red-700 font-bold">Firebase non connecté</Text>
        </View>
        <Text className="text-red-600 text-sm">
          {result?.errorMessage || "Impossible de se connecter à Firebase"}
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-green-100 rounded-xl p-4 mx-4 my-2 border border-green-300">
      <View className="flex-row items-center mb-2">
        <Text className="text-2xl">✅</Text>
        <Text className="ml-3 text-green-700 font-bold">Firebase connecté</Text>
      </View>
      <View className="space-y-1">
        <Text className="text-green-600 text-sm">
          • Authentication : {result?.auth ? "OK ✓" : "Erreur ✗"}
        </Text>
        <Text className="text-green-600 text-sm">
          • Firestore : {result?.firestore ? "OK ✓" : "Permission refusée (normal si non connecté)"}
        </Text>
      </View>
    </View>
  );
}

export default FirebaseStatus;