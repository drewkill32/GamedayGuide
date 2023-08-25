<template>
  <nav>
    <span class="links">
      <a href="/about">About</a>
    </span>
    <input type="text" placeholder="Search" />
  </nav>
</template>

<style scoped>
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  height: 4rem;
  background-color: #333;
  color: #fff;
}
.links {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
}
a {
  color: #fff;
  text-decoration: none;
}
input {
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #ccc;
}
</style>
