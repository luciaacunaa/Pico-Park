import { useEffect, useRef, useState } from "react";

import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  const socket = useRef<any>(null);

  const [connected, setConnected] = useState(false);

  const [ip, setIp] = useState("");
  const [showModal, setShowModal] = useState(true);

  const connectWebSocket = () => {
    if (!ip) return;

    socket.current = new WebSocket(`ws://${ip}:3000`);

    socket.current.onopen = () => {
      console.log("Conectado");
      setConnected(true);
      setShowModal(false);
    };

    socket.current.onclose = () => {
      console.log("Desconectado");
      setConnected(false);
    };

    socket.current.onerror = (error: any) => {
      console.log("Error websocket:", error);
    };
  };

  useEffect(() => {
    return () => {
      socket.current?.close();
    };
  }, []);

  const send = (action: string) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(action);
      console.log(action);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* MODAL IP */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ingresar IP</Text>

            <TextInput
              placeholder="192.168.1.25"
              value={ip}
              onChangeText={setIp}
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.connectButton}
              onPress={connectWebSocket}
            >
              <Text style={styles.connectText}>Conectar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TITULO */}
      <Text style={styles.title}>
        {connected ? "Connected" : "Disconnected"}
      </Text>

      {/* GAMEPAD */}
      <View style={styles.gamepad}>
        {/* D-PAD */}
        <View style={styles.pad}>
          <TouchableOpacity style={styles.button} onPressIn={() => send("up")}>
            <Text style={styles.buttonText}>↑</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.button}
              onPressIn={() => send("left")}
            >
              <Text style={styles.buttonText}>←</Text>
            </TouchableOpacity>

            <View style={{ width: 80 }} />

            <TouchableOpacity
              style={styles.button}
              onPressIn={() => send("right")}
            >
              <Text style={styles.buttonText}>→</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPressIn={() => send("down")}
          >
            <Text style={styles.buttonText}>↓</Text>
          </TouchableOpacity>
        </View>

        {/* BOTONES */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPressIn={() => send("a")}
          >
            <Text style={styles.actionText}>A</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPressIn={() => send("b")}
          >
            <Text style={styles.actionText}>B</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* START */}
      <TouchableOpacity
        style={styles.startButton}
        onPressIn={() => send("start")}
      >
        <Text style={styles.startText}>START</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d9d9d9",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
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
    borderColor: "#001f5c",
    borderRadius: 20,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
  },

  buttonText: {
    fontSize: 32,
    fontWeight: "bold",
  },

  actions: {
    flexDirection: "row",
    gap: 20,
  },

  actionButton: {
    width: 90,
    height: 160,
    borderWidth: 4,
    borderColor: "#001f5c",
    borderRadius: 20,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },

  actionText: {
    fontSize: 40,
    fontWeight: "bold",
  },

  startButton: {
    width: 140,
    height: 50,
    borderWidth: 4,
    borderColor: "#001f5c",
    borderRadius: 20,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },

  startText: {
    fontWeight: "bold",
    fontSize: 20,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: 300,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  input: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#001f5c",
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    marginBottom: 20,
  },

  connectButton: {
    backgroundColor: "#001f5c",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },

  connectText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
