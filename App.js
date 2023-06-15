import React, { useState, useEffect} from 'react';
import { StyleSheet, TextInput, View, SafeAreaView, Button, Text, FlatList, Alert, Modal, Image } from 'react-native';
import * as SQLite from 'expo-sqlite';

export default App = () => {
  const [nome, setNome] = useState('');
  const [nomeRelacoes, setNomeRelacoes] = useState('');
  const [tipoSanguineo, setTipoSanguineo] = useState('');
  const [items, setItems] = useState([]);
  const [empty, setEmpty] = useState([]);
  const [doadores, setDoadores] = useState([]);
  const [receptores, setReceptores] = useState([]);
  const [ready, setReady] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const achaDoadores = (tipo) => {
    tipo = tipo.toUpperCase();
    const doadores = {
      'O-': ['O-'],
      'O+': ['O-', 'O+'],
      'A-': ['O-', 'A-'],
      'A+': ['O-', 'O+', 'A-', 'A+'],
      'B-': ['O-', 'B-'],
      'B+': ['O-', 'O+', 'B-', 'B+'],
      'AB-': ['O-', 'A-', 'B-', 'AB-'],
      'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    };
    return doadores[tipo] || []
  }
  const achaReceptores = (tipo) => {
    tipo = tipo.toUpperCase();
    const receptores = {
      'O-': ['O-', 'A-', 'B-', 'AB-'],
      'O+': ['O-', 'A-', 'B-', 'AB-', 'O+', 'A+', 'B+', 'AB+'],
      'A-': ['A-', 'AB-'],
      'A+': ['A-', 'A+', 'AB-', 'AB+'],
      'B-': ['B-', 'AB-'],
      'B+': ['B-', 'B+', 'AB-', 'AB+'],
      'AB-': ['AB-'],
      'AB+': ['AB-', 'AB+'],
    };
    return receptores[tipo] || []
  }


  useEffect(() => {
    const db = SQLite.openDatabase("pessoa.db");
    db.transaction((tx) => {
      tx.executeSql("CREATE TABLE IF NOT EXISTS pessoa (indice INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, tipoSanguineo TEXT);");
    });
  }, []);

  const listarUsuarios = async () => {
    const db = SQLite.openDatabase("pessoa.db");
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM pessoa order by nome',
        [],
        (tx, results) => {
          var temp = [];
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
            setItems(temp);
            if (results.rows.length >= 1) {
              setEmpty(false);
            } else {
              setEmpty(true)
            }
          }
        }
      );
    });
  }

  const descobrirTipoSanguino = async (nome) => {
    const db = SQLite.openDatabase("pessoa.db");
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM pessoa WHERE nome = ?`,
          [nome],
          (tx, result) => {
            if (result.rows.length > 0) {
              const tipoSanguineo = result.rows.item(0).tipoSanguineo;
              resolve(tipoSanguineo);

            } else {
              resolve(null); // Se não houver resultado, retorna null
            }
          },
          (error) => {
            reject(error); // Em caso de erro na consulta, rejeita a Promise
          }
        );
      });
    });
  };

  const listarPorTipo = async (tipo) => {
    const db = SQLite.openDatabase("pessoa.db");
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM pessoa WHERE tipoSanguineo = ?`,
          [tipo],
          (tx, results) => {
            if (results.rows.length > 0) {
              var temp = [];
              for (let i = 0; i < results.rows.length; ++i) {
                temp.push(results.rows.item(i));
                console.log(temp);
              }
              resolve(temp);

            } else {
              resolve(null); // Se não houver resultado, retorna null
            }
          },
          (error) => {
            reject(error); // Em caso de erro na consulta, rejeita a Promise
          }
        );
      });
    });
  }

  const listarRelacoes = async (nome) => {
    setReady(false);
    let sangue = await descobrirTipoSanguino(nome);
    if (sangue) {
      //doadores
      var tiposDoadores = [];
      tiposDoadores = achaDoadores(sangue);
      var tempDoadores = []
      for (let i = 0; i < tiposDoadores.length; i++) {
        var aux = [];
        aux = await listarPorTipo(tiposDoadores[i])
        if (aux) {
          for (let j = 0; j < aux.length; j++)
            if (aux[j].nome != nomeRelacoes)
              tempDoadores.push(aux[j])
        }
        else;
        //tempDoadores.push(["Não há"])
      }

      setDoadores(tempDoadores)

      //receptores
      var tiposReceptores = [];
      tiposReceptores = achaReceptores(sangue);
      var tempReceptores = []
      for (let i = 0; i < tiposReceptores.length; i++) {
        var aux = [];
        aux = await listarPorTipo(tiposReceptores[i])
        if (aux)
          for (let j = 0; j < aux.length; j++) {
            if (aux[j].nome != nomeRelacoes)
              tempReceptores.push(aux[j])
          }
      }
      setReceptores(tempReceptores)
      console.log("Vetor " + tempReceptores)
      setReady(true);
    }
    else {
      Alert.alert("Alerta", "Usuário não consta no banco de sangue");
    }

  }

  const apagarTabela = () => {
    const db = SQLite.openDatabase("pessoa.db");
    db.transaction((tx) => {
      tx.executeSql("drop table if exists pessoa;");
    });
    setEmpty(true);
    setItems(null);
    setNome('');
    setTipoSanguineo('');
  }

  const mostrarTabela = () => {
    setModalVisible(true);
  }

  const esconderTabela = () => {
    setModalVisible(false);
  }

  const salvarUsuario = () => {
    if ((nome != '') && (tipoSanguineo != '')) {

      const db = SQLite.openDatabase("pessoa.db");
      db.transaction(
        (tx) => {
          tx.executeSql('INSERT INTO pessoa (nome, tipoSanguineo) VALUES (?,?)',
            [nome, tipoSanguineo], (resultSet) => {
              Alert.alert("Alerta", "Registro salvo com sucesso");
            }, (error) => {
              console.log(error);
            }
          )
        }
      );
      setNome('');
      setTipoSanguineo('');
    }
    else if (nome == '') Alert.alert("Alert", "Campo do nome vazio")
    else if (tipoSanguineo == '') Alert.alert("Alert", "Campo do tipo sanguineo vazio")
  };

  const separadorItem = () => {
    return (
      <View
        style={{
          height: 1,
          width: '100%',
          backgroundColor: '#000'
        }}
      />
    );
  };

  mensagemVazia = (status) => {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <Text style={{ fontSize: 25, textAlign: 'center' }}>
        </Text>
      </View>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <TextInput
          placeholder="Entre com o Nome"
          onChangeText={
            (nome) => setNome(nome)
          }
          value={nome}
          maxLength={20}
          style={{ padding: 10 }}
        />
        <TextInput
          placeholder="Entre com o tipo sanguineo"
          onChangeText={
            (tipoSanguineo) => setTipoSanguineo(tipoSanguineo)
          }
          value={tipoSanguineo}
          maxLength={20}
          style={{ padding: 10 }}
        />
        <View style={styles.button}>
          <Button title="Salvar Usuário" onPress={() => salvarUsuario()} />
          {/*<Button title="Apagar Tabela" onPress={() => apagarTabela()} />*/}
          {/*<Button title="Listar Usuários" onPress={() => listarUsuarios()} />*/}
          <Button title="tabela doação" onPress={() => mostrarTabela()} />
          
          <Modal visible={modalVisible} transparent={true} onRequestClose={esconderTabela}>
            <View style={styles.modalContainer}>
              <Button title="Fechar" onPress={esconderTabela} />
              <Image source={require("")} style={styles.modalImage} />
            </View>
          </Modal>
          
        </View>
        <View style={styles.container}>
          <TextInput
            placeholder="Entre com o Nome"
            onChangeText={
              (nome) => setNomeRelacoes(nome)
            }
            value={nomeRelacoes}
            maxLength={20}
            style={{ padding: 10 }}
          />
          <View style={styles.button}>
            <Button title="Listar doares e recebedor" onPress={() => listarRelacoes(nomeRelacoes)} />
          </View>
        </View>
        <View style={styles.container}>
          {empty ? mensagemVazia(empty) :
            <FlatList
              data={items}
              ItemSeparatorComponent={separadorItem}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) =>
                <View key={item.indice} style={styles.container}>
                  <Text style={styles.itemsStyle}> {item.nome}{'\n'}tipoSanguineo: {item.tipoSanguineo} </Text>
                </View>
              }
            />
          }
        </View>
        <Text style={styles.title}>Possíveis doadores</Text>
        <View style={styles.container}>
          {!ready ? mensagemVazia(!ready) :
            <FlatList
              data={doadores}
              contentContainerStyle={styles.flatListContent}
              ItemSeparatorComponent={separadorItem}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) =>
                <View key={item.indice} style={styles.container}>
                  <Text style={styles.itemsStyle}> {item.nome}{'\n'}tipoSanguineo: {item.tipoSanguineo} </Text>
                </View>
              }
            />
          }
        </View>
        <Text style={styles.title}>Possíveis receptores</Text>
        <View style={styles.container}>
          {!ready ? mensagemVazia(!ready) :
            <FlatList
              data={receptores}
              ItemSeparatorComponent={separadorItem}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) =>
                <View key={item.indice} style={styles.container}>
                  <Text style={styles.itemsStyle}> {item.nome}{'\n'}tipoSanguineo: {item.tipoSanguineo} </Text>
                </View>
              }
            />
          }
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    marginTop: 15,
    padding: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});
