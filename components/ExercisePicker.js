      <TextInput
        placeholder={value?.name ? `Selected: ${value.name}` : placeholder}
        onChangeText={setQuery}
        style={styles.search}
        accessibilityLabel="Exercise search"
      />
