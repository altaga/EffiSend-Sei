import { MaterialIcons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import React, { Component, createRef } from "react";
import { Pressable, View } from "react-native";
import { mainColor } from "../core/styles";
import { isValidUUID } from "../core/utils";

export default class CamQR extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scanning: true,
      refresh: true,
      facing: this.props.facing,
    };
  }

  handleBarcodeScanned = (result) => {
    let temp = result.data;
    console.log(temp);
    if (isValidUUID(temp) && this.state.scanning) {
      this.setState(
        {
          scanning: false,
        },
        () => {
          this.props.callbackAddress(temp);
        }
      );
    }
  };

  render() {
    return (
      <React.Fragment>
        {this.state.refresh && (
          <CameraView
            onBarcodeScanned={this.handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            ratio={"1:1"}
            facing={this.state.facing}
            style={{ height: "100%", width: "100%" }}
          />
        )}
        <View style={{ position: "absolute" }}>
          <Pressable
            onPress={() => {
              this.setState(
                {
                  facing: this.state.facing === "back" ? "front" : "back",
                  refresh: false,
                },
                () => {
                  this.setState({ refresh: true });
                }
              );
            }}
            style={[
              {
                margin: 10,
                width: "10%",
                height: "auto",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: mainColor,
                borderColor: "white",
                borderWidth: 2,
                borderRadius: 50,
                aspectRatio: 1,
                padding: 20,
              },
            ]}
          >
            <MaterialIcons name="cameraswitch" size={22} color="white" />
          </Pressable>
        </View>
      </React.Fragment>
    );
  }
}
