import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { Button, Card, Chip, Divider, Menu, Searchbar, Text, TextInput } from 'react-native-paper';
import { categories, Medicine, medicines } from '../../../constants/medicineData';
import { useCart } from '../../../contexts/CartContext';

type SortOption = 'name' | 'price-low' | 'price-high';
type FilterCategory = string | null;

export default function PharmacyScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [menuVisible, setMenuVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { addToCart, updateQuantity, getItemQuantity, getTotalItems } = useCart();

  const filteredAndSortedMedicines = useMemo(() => {
    let filtered = medicines.filter((medicine) => {
      const matchesSearch = medicine['Generic Name']
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory = !filterCategory || medicine['Group Name'] === filterCategory;
      const price = parseFloat(medicine.MRP);
      const matchesMinPrice = !minPrice || price >= parseFloat(minPrice);
      const matchesMaxPrice = !maxPrice || price <= parseFloat(maxPrice);
      return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a['Generic Name'].localeCompare(b['Generic Name']);
        case 'price-low':
          return parseFloat(a.MRP) - parseFloat(b.MRP);
        case 'price-high':
          return parseFloat(b.MRP) - parseFloat(a.MRP);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, sortBy, filterCategory, minPrice, maxPrice]);

  const openMedicineDetails = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: Medicine }) => (
    <Card
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}
    >
      <TouchableOpacity onPress={() => openMedicineDetails(item)}>
        <Card.Content style={{ padding: 20 }}>
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#1e293b',
                lineHeight: 24,
                marginBottom: 8,
              }}
              numberOfLines={2}
            >
              {item['Generic Name']}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  backgroundColor: '#dcfce7',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 20,
                  marginRight: 8,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#059669' }}>
                  {item['Unit Size']}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: '#f1f5f9',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 20,
                }}
              >
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Code: {item['Drug Code']}</Text>
              </View>
            </View>
          </View>

          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <View>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#059669' }}>
                ₹{item.MRP}
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>per pack</Text>
            </View>
            {getItemQuantity(item['Sr No']) > 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#f1f5f9',
                  borderRadius: 12,
                  padding: 4,
                }}
              >
                <TouchableOpacity
                  onPress={() => updateQuantity(item['Sr No'], getItemQuantity(item['Sr No']) - 1)}
                  style={{
                    backgroundColor: '#059669',
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="remove" size={16} color="white" />
                </TouchableOpacity>
                <Text
                  style={{
                    marginHorizontal: 16,
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#059669',
                  }}
                >
                  {getItemQuantity(item['Sr No'])}
                </Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(item['Sr No'], getItemQuantity(item['Sr No']) + 1)}
                  style={{
                    backgroundColor: '#059669',
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="add" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                mode="contained"
                onPress={() => addToCart(item)}
                style={{
                  backgroundColor: '#059669',
                  borderRadius: 12,
                  paddingHorizontal: 8,
                }}
                labelStyle={{ fontSize: 14, fontWeight: '600' }}
              >
                Add to Cart
              </Button>
            )}
          </View>

          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: '#f1f5f9',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#6b7280' }}>Category</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
              {item['Group Name']}
            </Text>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  return (
    <>
      {/* Modern Header */}
      <View
        style={{
          backgroundColor: 'white',
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1e293b' }}>Pharmacy</Text>
          <TouchableOpacity
            onPress={() => router.push('/cart')}
            style={{
              position: 'relative',
              backgroundColor: '#f1f5f9',
              padding: 12,
              borderRadius: 12,
            }}
          >
            <Ionicons name="cart-outline" size={24} color="#059669" />
            {getTotalItems() > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: '#ef4444',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}
                >
                  {getTotalItems()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Searchbar
          placeholder="Search medicines..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{
            backgroundColor: '#f1f5f9',
            borderRadius: 16,
            elevation: 0,
          }}
          placeholderTextColor={'#000000'}
          inputStyle={{ fontSize: 16, color: '#000000' }}
          iconColor="#64748b"
        />

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 16 }}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          <Chip
            selected={!filterCategory}
            onPress={() => setFilterCategory(null)}
            style={{
              backgroundColor: !filterCategory ? '#059669' : '#f1f5f9',
              height: 40,
              marginRight: 12,
            }}
            textStyle={{
              color: !filterCategory ? 'white' : '#64748b',
              fontSize: 14,
              fontWeight: '500',
            }}
          >
            All Categories
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category}
              selected={filterCategory === category}
              onPress={() => setFilterCategory(filterCategory === category ? null : category)}
              style={{
                backgroundColor: filterCategory === category ? '#059669' : '#f1f5f9',
                height: 40,
                marginRight: 12,
              }}
              textStyle={{
                color: filterCategory === category ? 'white' : '#64748b',
                fontSize: 14,
                fontWeight: '500',
              }}
            >
              {category.split('/')[0]}
            </Chip>
          ))}
        </ScrollView>

        {/* Price Range and Sort */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
          <View style={{ flexDirection: 'row', flex: 1 }}>
            <TextInput
              label="Min ₹"
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
              maxLength={5}
              style={{
                backgroundColor: '#f1f5f9',
                height: 48,
                flex: 1,
                marginRight: 8,
              }}
              contentStyle={{ fontSize: 14, color: '#000000' }}
            />
            <TextInput
              label="Max ₹"
              value={maxPrice}
              maxLength={5}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
              style={{
                backgroundColor: '#f1f5f9',
                height: 48,
                flex: 1,
              }}
              contentStyle={{ fontSize: 14, color: '#000000' }}
            />
          </View>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            contentStyle={{ backgroundColor: 'white', borderRadius: 12 }}
            anchor={
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(true);
                }}
                style={{
                  backgroundColor: '#f1f5f9',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 48,
                  marginLeft: 12,
                }}
              >
                <Ionicons name="swap-vertical" size={20} color="#6b7280" />
                <Text style={{ marginLeft: 8, color: '#6b7280', fontWeight: '500' }}>Sort</Text>
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setSortBy('name');
                setMenuVisible(false);
              }}
              title="Name (A-Z)"
              titleStyle={{ fontSize: 14,color: sortBy === 'name' ? '#059669' : undefined }}
            />
            <Menu.Item
              onPress={() => {
                setSortBy('price-low');
                setMenuVisible(false);
              }}
              title="Price (Low to High)"
              titleStyle={{ fontSize: 14,color: sortBy === 'price-low' ? '#059669' : undefined }}
            />
            <Menu.Item
              onPress={() => {
                setSortBy('price-high');
                setMenuVisible(false);
              }}
              title="Price (High to Low)"
              titleStyle={{ fontSize: 14,color: sortBy === 'price-high' ? '#059669' : undefined }}
            />
          </Menu>
        </View>
      </View>

      {/* Medicine List */}
      <FlatList
        data={filteredAndSortedMedicines}
        keyExtractor={(item) => item['Sr No']}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 20,
          paddingBottom: 40,
        }}
        ListEmptyComponent={() => (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 80,
              paddingHorizontal: 40,
            }}
          >
            <View
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: 100,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <Ionicons name="search-outline" size={48} color="#cbd5e1" />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                marginBottom: 8,
                color: '#475569',
                textAlign: 'center',
              }}
            >
              No medicines found
            </Text>
            <Text
              style={{
                fontSize: 16,
                marginBottom: 32,
                color: '#64748b',
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              We couldn&apos;t find any medicines matching your search criteria.
            </Text>

            {/* Quick Actions */}
            <View style={{ width: '100%', gap: 12 }}>
              {(searchQuery || filterCategory || minPrice || maxPrice) && (
                <Button
                  mode="outlined"
                  onPress={() => {
                    setSearchQuery('');
                    setFilterCategory(null);
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                  style={{
                    borderColor: '#059669',
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: '#059669', fontSize: 16, fontWeight: '500' }}
                >
                  Clear all filters
                </Button>
              )}
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} animationType="slide">
        <View style={{ backgroundColor: 'white', margin: 20, borderRadius: 16, flex: 1 }}>
          <ScrollView style={{ padding: 24 }}>
            {selectedMedicine && (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 24,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: 'bold',
                      flex: 1,
                      color: '#1e293b',
                    }}
                  >
                    {selectedMedicine['Generic Name']}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={{
                      backgroundColor: '#f1f5f9',
                      padding: 8,
                      borderRadius: 20,
                      marginLeft: 16,
                    }}
                  >
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 24,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 36,
                      fontWeight: 'bold',
                      marginBottom: 8,
                      color: '#059669',
                    }}
                  >
                    ₹{selectedMedicine.MRP}
                  </Text>
                  <Text style={{ fontSize: 16, color: '#6b7280' }}>
                    per {selectedMedicine['Unit Size']}
                  </Text>
                </View>

                <Divider style={{ marginBottom: 24 }} />

                <View style={{ marginBottom: 32 }}>
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        marginBottom: 4,
                        color: '#6b7280',
                      }}
                    >
                      Drug Code
                    </Text>
                    <Text style={{ fontSize: 18, color: '#374151' }}>
                      {selectedMedicine['Drug Code']}
                    </Text>
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        marginBottom: 4,
                        color: '#6b7280',
                      }}
                    >
                      Unit Size
                    </Text>
                    <Text style={{ fontSize: 18, color: '#374151' }}>
                      {selectedMedicine['Unit Size']}
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        marginBottom: 4,
                        color: '#6b7280',
                      }}
                    >
                      Category
                    </Text>
                    <Text style={{ fontSize: 18, color: '#374151' }}>
                      {selectedMedicine['Group Name']}
                    </Text>
                  </View>
                </View>

                {getItemQuantity(selectedMedicine['Sr No']) > 0 ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f1f5f9',
                      borderRadius: 12,
                      padding: 8,
                      marginTop: 16,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        updateQuantity(
                          selectedMedicine['Sr No'],
                          getItemQuantity(selectedMedicine['Sr No']) - 1,
                        )
                      }
                      style={{
                        backgroundColor: '#059669',
                        borderRadius: 8,
                        width: 36,
                        height: 36,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="remove" size={18} color="white" />
                    </TouchableOpacity>
                    <Text
                      style={{
                        marginHorizontal: 24,
                        fontSize: 18,
                        fontWeight: '600',
                        color: '#059669',
                      }}
                    >
                      {getItemQuantity(selectedMedicine['Sr No'])}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        updateQuantity(
                          selectedMedicine['Sr No'],
                          getItemQuantity(selectedMedicine['Sr No']) + 1,
                        )
                      }
                      style={{
                        backgroundColor: '#059669',
                        borderRadius: 8,
                        width: 36,
                        height: 36,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="add" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Button
                    mode="contained"
                    onPress={() => {
                      addToCart(selectedMedicine);
                      setModalVisible(false);
                    }}
                    style={{
                      backgroundColor: '#059669',
                      marginTop: 16,
                      borderRadius: 12,
                      paddingVertical: 4,
                    }}
                    labelStyle={{ fontSize: 16, fontWeight: '600' }}
                  >
                    Add to Cart - ₹{selectedMedicine.MRP}
                  </Button>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
