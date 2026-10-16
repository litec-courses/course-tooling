<template>
  <footer class="litec-footer">
    <span>{{ $slidev.configs.themeConfig.courseLabel || 'Course' }}</span>
    <span>{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</span>
  </footer>
</template>
