import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  NativeAppEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  AppState,
  Dimensions,
  FlatList,
} from 'react-native';
import BleManager from 'react-native-ble-manager';

var Buffer = require('buffer/').Buffer

const window = Dimensions.get('window');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export default class E1 extends Component {

  static navigationOptions = { header: null }

  constructor(props) {
    super(props);

    this.state = {
      scanning: false,
      peripherals: new Map(),
      appState: '',
    }

    this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
    this.handleStopScan = this.handleStopScan.bind(this);
    this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
    this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);

    BleManager.start({ showAlert: false }, () => {
      console.log('Module initialized');
    });

    this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral);
    this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan);
    this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral);
    this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic);

    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)
        .then((result) => {
          if (result) {
            console.log("Permission is OK: ", result);
          } else {
            PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)
              .then((result) => {
                if (result) {
                  console.log("User accept: ", result);
                } else {
                  console.log("User refuse");
                }
              });
          }
        });
    }

  }

  handleAppStateChange(nextAppState) {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!')
      BleManager.getConnectedPeripherals([])
        .then((peripheralsArray) => {
          console.log('Connected peripherals: ' + peripheralsArray.length);
        });
    }
    this.setState({ appState: nextAppState });
  }

  componentWillUnmount() {
    this.handlerDiscover.remove();
    this.handlerStop.remove();
    this.handlerDisconnect.remove();
    this.handlerUpdate.remove();
  }

  handleDisconnectedPeripheral(data) {
    let peripherals = this.state.peripherals;
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      this.setState({ peripherals }, () => {
        console.log('peripherals currently: ', this.state.peripherals);
      });
    }
    console.log('Disconnected from ' + data.peripheral);
  }

  handleUpdateValueForCharacteristic(data) {
    console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
  }

  handleStopScan() {
    console.log('Scan is stopped');
    this.setState({ scanning: false });
  }

  startScan() {
    if (!this.state.scanning) {
      this.setState({ peripherals: new Map() });
      BleManager.scan([], 10, true)
        .then((results) => {
          console.log('Scanning...: ', results);
          this.setState({ scanning: true });
        });
    }
  }

  retrieveConnected() {
    BleManager.getConnectedPeripherals([])
      .then((results) => {
        if (results.length == 0) {
          alert('No connected peripherals')
        }
        console.log('retrieveConnected: ', results);
        var peripherals = this.state.peripherals;
        for (var i = 0; i < results.length; i++) {
          var peripheral = results[i];
          peripheral.connected = true;
          peripherals.set(peripheral.id, peripheral);
          this.setState({ peripherals });
        }
      });
  }

  handleDiscoverPeripheral(peripheral) {
    var peripherals = this.state.peripherals;
    if (!peripherals.has(peripheral.id)) {
      console.log('Got ble peripheral', peripheral);
      peripherals.set(peripheral.id, peripheral);
      this.setState({ peripherals })
    }
  }

  moveToDetail(peripheral) {
    if (peripheral) {
      if (peripheral.connected) {
        BleManager.disconnect(peripheral.id).then(() => {
          alert('disconnected');
        }).catch((e) => {
          alert('error1: ', e);
        });
      } else {
        BleManager.connect(peripheral.id).then(() => {
          let peripherals = this.state.peripherals;
          let p = peripherals.get(peripheral.id);
          if (p) {
            p.connected = true;
            peripherals.set(peripheral.id, p);
            this.setState({ peripherals });
          }
          console.log('Connected to 1: ' + peripheral.id);

          // read data
          BleManager.retrieveServices(peripheral.id).then((peripheralData) => {
            console.log('Retrieved peripheral services', peripheralData);
            this.setState({ peripheralData }, () => {
              console.log('peripheralData: ', peripheralData);
            });
            this.props.navigation.navigate('Details', { data: peripheralData });
          });

        }).catch((error) => {
          console.log('Connection error', error);
        });
      }
    }
  }

  renderItem = ({ item }) => {
    const color = item.connected ? 'green' : '#fff';
    return (
      <TouchableHighlight
        onPress={() => this.moveToDetail(item)}>
        <View>
          <View
            style={
              [
                styles.row,
                {
                  backgroundColor: color,
                  borderWidth: 1,
                  borderColor: 'red'
                }
              ]}>
            <Text
              style={{
                fontSize: 12,
                textAlign: 'center',
                color: '#333333',
                padding: 10
              }}
            >
              {item.name}
            </Text>
            <Text
              style={{
                fontSize: 8,
                textAlign: 'center',
                color: '#333333',
                padding: 10
              }}
            >
              {item.id}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    );
  }

  render() {
    const dataSource = Array.from(this.state.peripherals.values());

    return (
      <View style={styles.container}>
        <TouchableHighlight
          style={{ marginTop: 40, margin: 20, padding: 20, backgroundColor: '#ccc' }}
          onPress={() => this.startScan()}>
          <Text>Scan Bluetooth ({this.state.scanning ? 'on' : 'off'})</Text>
        </TouchableHighlight>


        <FlatList
          keyExtractor={item => item.id}
          data={dataSource}
          renderItem={this.renderItem}
          style={{ flex: 1, margin: 1 }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    width: window.width,
    height: window.height
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    margin: 10,
  },
  row: {
    margin: 10
  },
});
