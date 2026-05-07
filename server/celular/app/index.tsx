import { useEffect, useRef, useState } from "react";

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  const socket = useRef<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // ⚠️ CAMBIAR POR TU IP
    socket.current = new WebSocket("ws://10.56.2.28:3000");

    socket.current.onopen = () => {
      console.log("Conectado");
      setConnected(true);
    };

    socket.current.onclose = () => {
      console.log("Desconectado");
      setConnected(false);
    };

    socket.current.onerror = (error: any) => {
      console.log("Error websocket:", error);
    };

    return () => {
      socket.current?.close();
    };
  }, []);

  const send = (action: string) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(action);
      console.log("Enviado:", action);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        {connected ? "Connected" : "Connecting..."}
      </Text>

      <View style={styles.gamepad}>
        {/* D-PAD */}
        <View style={styles.pad}>
          <TouchableOpacity
            style={styles.button}
            onPressIn={() => send("up")}
          />

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.button}
              onPressIn={() => send("left")}
            />

            <View style={{ width: 80 }} />

            <TouchableOpacity
              style={styles.button}
              onPressIn={() => send("right")}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPressIn={() => send("down")}
          />
        </View>

        {/* BOTONES */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPressIn={() => send("a")}
          />

          <TouchableOpacity
            style={styles.actionButton}
            onPressIn={() => send("b")}
          />
        </View>
      </View>

      {/* START */}
      <TouchableOpacity
        style={styles.startButton}
        onPressIn={() => send("start")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ddd",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
  },

  gamepad: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  pad: {
    alignItems: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  button: {
    width: 80,
    height: 80,
    borderWidth: 4,
    borderColor: "navy",
    borderRadius: 15,
    margin: 10,
    backgroundColor: "#eee",
  },

  actions: {
    flexDirection: "row",
    gap: 20,
  },

  actionButton: {
    width: 100,
    height: 180,
    borderWidth: 4,
    borderColor: "navy",
    borderRadius: 15,
    backgroundColor: "#eee",
  },

  startButton: {
    width: 120,
    height: 50,
    borderWidth: 4,
    borderColor: "navy",
    borderRadius: 15,
    backgroundColor: "#eee",
  },
});