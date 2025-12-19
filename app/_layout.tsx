/**
 * Layout racine de l'application
 * Gère l'initialisation Firebase et la redirection auth
 */

import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { auth, firestore } from "../config/firebase";
import { useAuthStore } from "../stores/authStore";
import { LoadingScreen } from "../components/ui/LoadingSpinner";
import { User } from "../types";

import "../global.css";

export default function RootLayout() {
  const {
    setFirebaseUser,
    setUserData,
    setLoading,
    setInitialized,
    isLoading,
    isInitialized,
  } = useAuthStore();

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged(async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.uid || "null");
      
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await firestore()
            .collection("users")
            .doc(firebaseUser.uid)
            .get();
          
          if (userDoc.exists) {
            setUserData({
              id: userDoc.id,
              ...userDoc.data(),
            } as User);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  if (!isInitialized || isLoading) {
    return (
      <View className="flex-1 bg-pink-50">
        <StatusBar style="dark" />
        <LoadingScreen message="Chargement..." />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FDF2F8" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}