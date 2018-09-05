import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TouchableHighlight,
    NativeEventEmitter,
    NativeModules,
    Dimensions,
    FlatList,
} from 'react-native';
import { stringToBytes } from 'convert-string';
import BleManager from 'react-native-ble-manager';

const window = Dimensions.get('window');



const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export default class ItemCom extends Component {
    constructor(props) {
        super(props);
        this.state = {
            resultTxt: 'result here',
        }
    }

    static navigationOptions = ({ navigation }) => {
        const data = navigation.getParam('data', null);
        if (data != null) {
            return {
                title: data.id,
            };
        } else {
            return {
                title: 'Details'
            };
        }
    };

    onRead(item) {
        const data = this.props.navigation.getParam('data', null);
        BleManager.connect(data.id)
            .then(() => {
                // read data
                BleManager.read(data.id, item.service, item.characteristic)
                    .then((readData) => {
                        var Buffer = require('buffer/').Buffer;
                        const buffer = Buffer.from(readData);
                        const sensorData = buffer.readUInt8(1, true);
                        this.setState({ resultTxt: sensorData });
                        console.log('sensorData', sensorData);
                    })

            }).catch((error) => {
                console.log('Connection error', error);
            });
    }

    startNotification() {
        const data = this.props.navigation.getParam('data', null);
        const service = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
        const characteristic = '49535343-aca3-481c-91ec-d85e28a60318';
        BleManager.connect(data.id)
            .then(() => {
                // read data
                BleManager.startNotification(data.id, service, characteristic)
                    .then((result) => {
                        alert(result);
                        console.log('====', result);
                    })
            }).catch((error) => {
                console.log('startNotification', error);
            });
    }

    test() {
        alert('this is test');
    }

    write(dataToWrite, maxByteSize) {//
        const data = this.props.navigation.getParam('data', null);
        const service = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
        const characteristic = '49535343-6daa-4d02-abf6-19569aca69fe';
        console.log('=====', dataToWrite, maxByteSize);

        BleManager.connect(data.id)
            .then(() => {
                // read data
                const dt = stringToBytes(dataToWrite);
                BleManager.write(data.id, service, characteristic, dt, maxByteSize)
                    .then((result) => {
                        alert(result);
                        console.log('====', result);
                    })
            }).catch((error) => {
                console.log('write', error);
            });
    }


    writeWithoutResponse(dataToWrite, maxByteSize) {//dataToWrite, maxByteSize, queueSleepTime
        const data = this.props.navigation.getParam('data', null);
        const service = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
        const characteristic = '49535343-8841-43f4-a8d4-ecbe34729bb3';

        BleManager.connect(data.id)
            .then(() => {
                // read data
                const dt = stringToBytes(dataToWrite);
                BleManager.writeWithoutResponse(data.id, service, characteristic, dt, maxByteSize)
                    .then((result) => {
                        alert(result);
                        console.log('====', result);
                    })
            }).catch((error) => {
                console.log('writeWithoutResponse', error);
            });
    }


    renderListHeaderComponent = () => {
        return (
            <View
                style={{
                    flexDirection: 'column',
                    flex: 1,
                    backgroundColor: 'red'
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'stretch',
                        backgroundColor: 'yellow',
                        flex: 1
                    }}
                >
                    <TouchableOpacity
                        onPress={() => { this.startNotification() }}
                    >
                        <Text>Notification</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => { this.write('hello', 100) }}
                    >
                        <Text>Write</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => { this.writeWithoutResponse('hello', 100) }}
                    >
                        <Text>WriteWithoutResponse</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => { this.test() }}
                    >
                        <Text>test</Text>
                    </TouchableOpacity>
                </View>

                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        backgroundColor: 'green'
                    }}
                >
                    <Text>characteristicUUID</Text>
                    <Text>serviceUUID</Text>
                    <Text>Action</Text>
                </View>
            </View>

        );
    }

    renderItem = ({ item }) => {
        return (
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    borderWidth: 1,
                    borderColor: 'red'
                }}
            >
                <Text
                    style={{
                        color: 'green',
                        width: 100,
                    }}
                >
                    {item.characteristic}
                </Text>
                <Text
                    style={{
                        color: 'red',
                        width: 100,
                    }}
                >
                    {item.service}
                </Text>
                <TouchableOpacity
                    onPress={this.onRead.bind(this, item)}
                >
                    <Text>Read</Text>
                </TouchableOpacity>

            </View>
        );
    }


    render() {
        const data = this.props.navigation.getParam('data', null);

        return (
            <View style={styles.container}>
                <View
                    style={{
                        alignItems: 'center',
                        height: 100,
                        justifyContent: 'center',
                    }}
                >
                    <Text
                        style={{ color: 'blue' }}
                    >{this.state.resultTxt}</Text>

                </View>
                <FlatList
                    ListHeaderComponent={this.renderListHeaderComponent}
                    data={data.characteristics}
                    renderItem={this.renderItem}
                    keyExtractor={(item, index) => { index }}
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
});
