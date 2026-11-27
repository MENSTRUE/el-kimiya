package com.menstrue.elkimiya

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/** Process-local launch gate, not Firebase authentication or a backend security boundary. */
internal object NativeTutorAccess {
    private val active = MutableStateFlow(false)
    val allowed: StateFlow<Boolean> = active
    fun grant() { active.value = true }
    fun revoke() { active.value = false }
}
