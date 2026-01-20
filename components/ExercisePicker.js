      <TextInput
        placeholder={value?.name ? `Selected: ${value.name}` : placeholder}
        value={query}
        onChangeText={setQuery}
        style={styles.search}
        accessibilityLabel="Exercise search"
      />
