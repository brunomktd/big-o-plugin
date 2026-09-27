import org.jetbrains.intellij.platform.gradle.tasks.PrepareSandboxTask

plugins {
    id("org.jetbrains.kotlin.jvm") version "2.4.20"
    id("org.jetbrains.intellij.platform") version "2.19.0"
}

group = "dev.bigo"
version = "0.1.0"

repositories {
    mavenCentral()
    intellijPlatform { defaultRepositories() }
}

dependencies {
    intellijPlatform {
        val localIde = providers.gradleProperty("localIde").orNull?.takeIf { file(it).isDirectory }
        if (localIde != null) local(localIde) else intellijIdea("2026.2")
        plugin("com.redhat.devtools.lsp4ij:0.21.0")
    }
}

kotlin { jvmToolchain(21) }

intellijPlatform {
    buildSearchableOptions = false
    pluginConfiguration {
        ideaVersion {
            sinceBuild = "242"
            untilBuild = provider { null }
        }
    }
}

val serverDist = layout.projectDirectory.dir("../server/dist")

tasks.withType<PrepareSandboxTask>().configureEach {
    from(serverDist) { into("${rootProject.name}/server") }
}

tasks.runIde {
    args(layout.projectDirectory.dir("../docs/samples").asFile.absolutePath)
}
