<script>
  export let isMigrationDone
  export let onMigrationDone
  export let timeoutSeconds = 10 // 3 minutes

  const loadTime = Date.now()
  let timedOut = false

  async function checkMigrationsFinished() {
    setTimeout(async () => {
      const isMigrated = await isMigrationDone()

      const timeoutMs = timeoutSeconds * 1000
      if (!isMigrated) {
        if (loadTime + timeoutMs > Date.now()) {
          return checkMigrationsFinished()
        }

        return migrationTimeout()
      }

      onMigrationDone()
    }, 1000)
  }

  checkMigrationsFinished()

  function migrationTimeout() {
    timedOut = true
  }
</script>

<div class="loading" class:timeout={timedOut}>
  <span class="header">
    {#if !timedOut}
      System update
    {:else}
      Something went wrong!
    {/if}
  </span>
  <span class="subtext">
    {#if !timedOut}
      Please wait and we will be back in a second!
    {:else}
      An error occurred, please try again later.
      <br />
      Contact
      <a href="https://budibase.com/support/" target="_blank">support</a> if the
      issue persists.
    {/if}</span
  >
</div>

<style>
  .loading {
    display: flex;
    justify-content: center;
    flex-direction: column;
    gap: var(--spacing-l);
    height: 100vh;
    text-align: center;
    font-size: 18px;
  }
  .header {
    color: brown;
    font-weight: 700;
  }
  .timeout .header {
    color: rgb(196, 46, 46);
  }
  .subtext {
    font-size: 16px;
    color: var(--grey-7);
  }

  .subtext a {
    color: var(--grey-7);
    font-weight: 700;
  }
</style>
