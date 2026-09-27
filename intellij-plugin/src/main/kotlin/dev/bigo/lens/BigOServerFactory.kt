package dev.bigo.lens

import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.ide.plugins.PluginManagerCore
import com.intellij.openapi.extensions.PluginId
import com.intellij.openapi.project.Project
import com.redhat.devtools.lsp4ij.LanguageServerFactory
import com.redhat.devtools.lsp4ij.server.OSProcessStreamConnectionProvider
import com.redhat.devtools.lsp4ij.server.StreamConnectionProvider

class BigOServerFactory : LanguageServerFactory {
    override fun createConnectionProvider(project: Project): StreamConnectionProvider = BigOConnectionProvider()
}

private class BigOConnectionProvider : OSProcessStreamConnectionProvider() {
    init {
        val plugin = PluginManagerCore.getPlugin(PluginId.getId("dev.bigo.lens"))
            ?: error("Big O Lens plugin descriptor not found")
        val server = plugin.pluginPath.resolve("server").resolve("server.js")
        commandLine = GeneralCommandLine("node", server.toString(), "--stdio")
            .withParentEnvironmentType(GeneralCommandLine.ParentEnvironmentType.CONSOLE)
    }
}
