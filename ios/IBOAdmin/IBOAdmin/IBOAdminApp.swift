import Foundation
import SwiftUI
import PhotosUI
import UIKit

@main
struct IBOAdminApp: App {
    @StateObject private var store = AdminStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
        }
    }
}

// MARK: - API models

struct CmsContent: Codable {
    var company: CmsCompany
    var settings: SiteSettings
    var navItems: [NavItem]
    var services: [ServiceItem]
    var stats: [StatItem]
    var trustItems: [IconTextItem]
    var processSteps: [IconTextItem]
    var projects: [ProjectCard]
    var beforeAfter: BeforeAfter
    var materials: [String]
    var cities: [CityItem]
    var testimonials: [TestimonialItem]
    var faqs: [FAQItem]
    var whyChoose: [IconTextItem]
    var checklist: [ChecklistItem]
    var galleryFilters: [String]
}

struct CmsCompany: Codable {
    var name: String
    var legalName: String
    var tagline: String
    var address: String
    var phone: String
    var phoneHref: String
    var email: String
    var emailHref: String
    var url: String
    var area: String
    var whatsapp: String
}

struct SiteSettings: Codable {
    var whatsappFloating: Bool
    var chatEnabled: Bool
    var quoteEnabled: Bool
    var chatGreeting: String
    var beforeAfterEnabled: Bool
    var heroImage: String
}

struct NavItem: Codable, Identifiable {
    var label: String
    var href: String
    var id: String { "\(label)-\(href)" }
}

struct ServiceItem: Codable, Identifiable {
    var slug: String
    var title: String
    var eyebrow: String
    var short: String
    var summary: String
    var image: String
    var iconName: String
    var highlights: [String]
    var seoTitle: String
    var seoDescription: String
    var id: String { slug }

    static func empty() -> ServiceItem {
        ServiceItem(
            slug: "neue-leistung-\(Int(Date().timeIntervalSince1970))",
            title: "Neue Leistung",
            eyebrow: "Kategorie",
            short: "Kurze Beschreibung der Leistung.",
            summary: "Ausfuehrliche Beschreibung der Leistung.",
            image: "/images/service-painting.png",
            iconName: "PaintRoller",
            highlights: ["Beratung", "Ausfuehrung"],
            seoTitle: "Neue Leistung | IBO Creative",
            seoDescription: "SEO Beschreibung der neuen Leistung."
        )
    }
}

struct ProjectCard: Codable, Identifiable {
    var title: String
    var category: String
    var image: String
    var text: String
    var id: String { "\(title)-\(category)-\(image)" }

    static func empty() -> ProjectCard {
        ProjectCard(
            title: "Neues Projekt",
            category: "Kategorie",
            image: "/images/ibo-hero.png",
            text: "Kurze Projektbeschreibung."
        )
    }
}

struct BeforeAfter: Codable {
    var title: String
    var text: String
    var beforeLabel: String
    var afterLabel: String
    var afterImage: String
}

struct StatItem: Codable, Identifiable {
    var label: String
    var value: Int
    var suffix: String
    var id: String { label }
}

struct IconTextItem: Codable, Identifiable {
    var title: String
    var text: String
    var iconName: String
    var id: String { "\(title)-\(iconName)" }
}

struct ChecklistItem: Codable, Identifiable {
    var text: String
    var iconName: String
    var id: String { text }
}

struct CityItem: Codable, Identifiable {
    var slug: String
    var name: String
    var title: String
    var intro: String
    var localFocus: [String]
    var seoTitle: String
    var seoDescription: String
    var id: String { slug }
}

struct TestimonialItem: Codable, Identifiable {
    var name: String
    var context: String
    var quote: String
    var id: String { "\(name)-\(context)" }
}

struct FAQItem: Codable, Identifiable {
    var question: String
    var answer: String
    var id: String { question }
}

struct QuoteLead: Codable, Identifiable {
    var id: String
    var name: String
    var phone: String
    var email: String
    var message: String
    var status: String
    var createdAt: String
}

struct ChatMessage: Codable, Identifiable {
    var id: String
    var name: String
    var email: String
    var message: String
    var status: String
    var createdAt: String
    var replies: [ChatReply]?
}

struct ChatReply: Codable, Identifiable {
    var id: String
    var author: String
    var message: String
    var createdAt: String
}

struct AdminInfo: Codable, Identifiable {
    var email: String
    var createdAt: String
    var id: String { email }
}

struct LoginPayload: Codable {
    var email: String
    var password: String
}

struct AdminPayload: Codable {
    var email: String
    var password: String
}

struct StatusPayload: Codable {
    var id: String
    var status: String
}

struct ReplyPayload: Codable {
    var id: String
    var reply: String
}

struct DeleteAdminPayload: Codable {
    var email: String
}

struct BasicOK: Codable {
    var ok: Bool?
}

struct SaveContentResponse: Codable {
    var ok: Bool
    var content: CmsContent
}

struct QuotesResponse: Codable {
    var quotes: [QuoteLead]
}

struct MessagesResponse: Codable {
    var messages: [ChatMessage]
}

struct AdminsResponse: Codable {
    var admins: [AdminInfo]
}

struct AddAdminResponse: Codable {
    var ok: Bool
    var admin: AdminInfo
}

struct UploadResponse: Codable {
    var ok: Bool?
    var url: String?
    var error: String?
}

struct ErrorResponse: Codable {
    var error: String
}

struct APIError: LocalizedError {
    var message: String
    var errorDescription: String? { message }
}

// MARK: - Store

@MainActor
final class AdminStore: ObservableObject {
    private static let baseURLKey = "IBOAdminBaseURL"
    private static let emailKey = "IBOAdminEmail"

    @Published var baseURL: String {
        didSet { UserDefaults.standard.set(baseURL, forKey: Self.baseURLKey) }
    }
    @Published var email: String {
        didSet { UserDefaults.standard.set(email, forKey: Self.emailKey) }
    }
    @Published var password = ""
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var status = "Ready"
    @Published var content: CmsContent?
    @Published var quotes: [QuoteLead] = []
    @Published var messages: [ChatMessage] = []
    @Published var admins: [AdminInfo] = []

    private let session: URLSession
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init() {
        baseURL = UserDefaults.standard.string(forKey: Self.baseURLKey) ?? "https://raumwerkpro.de"
        email = UserDefaults.standard.string(forKey: Self.emailKey) ?? "ibrahimalnuaimi.ik@gmail.com"

        let configuration = URLSessionConfiguration.default
        configuration.httpCookieAcceptPolicy = .always
        configuration.httpShouldSetCookies = true
        configuration.httpCookieStorage = .shared
        session = URLSession(configuration: configuration)
    }

    var newQuotes: Int {
        quotes.filter { $0.status == "new" }.count
    }

    var newChats: Int {
        messages.filter { $0.status == "new" }.count
    }

    var serviceCount: Int {
        content?.services.count ?? 0
    }

    var cardCount: Int {
        content?.projects.count ?? 0
    }

    func login() async {
        guard !email.isEmpty, !password.isEmpty else {
            status = "Email and password required"
            return
        }

        await run("Signing in...") {
            let body = try encoder.encode(LoginPayload(email: email, password: password))
            let _: BasicOK = try await perform("/api/admin/login", method: "POST", body: body)
            password = ""
            isAuthenticated = true
            try await loadAll()
            status = "Signed in"
        }
    }

    func logout() async {
        await run("Signing out...") {
            let _: BasicOK = try await perform("/api/admin/logout", method: "POST")
            isAuthenticated = false
            content = nil
            messages = []
            quotes = []
            admins = []
            status = "Signed out"
        }
    }

    func loadAll() async throws {
        let loadedContent: CmsContent = try await perform("/api/admin/content")
        let loadedQuotes: QuotesResponse = try await perform("/api/admin/quotes")
        let loadedMessages: MessagesResponse = try await perform("/api/admin/messages")
        let loadedAdmins: AdminsResponse = try await perform("/api/admin/admins")
        content = loadedContent
        quotes = loadedQuotes.quotes
        messages = loadedMessages.messages
        admins = loadedAdmins.admins
    }

    func refreshAll() async {
        await run("Refreshing...") {
            try await loadAll()
            status = "Updated"
        }
    }

    func refreshInbox(silent: Bool = false) async {
        do {
            let loadedQuotes: QuotesResponse = try await perform("/api/admin/quotes")
            let loadedMessages: MessagesResponse = try await perform("/api/admin/messages")
            quotes = loadedQuotes.quotes
            messages = loadedMessages.messages
            if !silent { status = "Inbox updated" }
        } catch {
            if !silent { status = error.localizedDescription }
        }
    }

    func saveContent() async {
        guard let content else { return }
        await run("Saving website...") {
            let body = try encoder.encode(content)
            let response: SaveContentResponse = try await perform("/api/admin/content", method: "PUT", body: body)
            self.content = response.content
            status = "Website saved"
        }
    }

    func reply(to message: ChatMessage, text: String) async {
        let cleaned = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleaned.isEmpty else { return }

        await run("Sending reply...") {
            let body = try encoder.encode(ReplyPayload(id: message.id, reply: cleaned))
            let response: MessagesResponse = try await perform("/api/admin/messages", method: "PATCH", body: body)
            messages = response.messages
            status = "Reply sent"
        }
    }

    func markMessage(_ message: ChatMessage, status nextStatus: String = "done") async {
        await run("Updating chat...") {
            let body = try encoder.encode(StatusPayload(id: message.id, status: nextStatus))
            let response: MessagesResponse = try await perform("/api/admin/messages", method: "PATCH", body: body)
            messages = response.messages
            status = "Chat updated"
        }
    }

    func markQuote(_ quote: QuoteLead, status nextStatus: String = "done") async {
        await run("Updating quote...") {
            let body = try encoder.encode(StatusPayload(id: quote.id, status: nextStatus))
            let response: QuotesResponse = try await perform("/api/admin/quotes", method: "PATCH", body: body)
            quotes = response.quotes
            status = "Quote updated"
        }
    }

    func addAdmin(email: String, password: String) async {
        await run("Adding admin...") {
            let body = try encoder.encode(AdminPayload(email: email, password: password))
            let response: AddAdminResponse = try await perform("/api/admin/admins", method: "POST", body: body)
            admins.insert(response.admin, at: 0)
            status = "Admin added"
        }
    }

    func deleteAdmin(_ admin: AdminInfo) async {
        await run("Deleting admin...") {
            let body = try encoder.encode(DeleteAdminPayload(email: admin.email))
            let _: BasicOK = try await perform("/api/admin/admins", method: "DELETE", body: body)
            admins.removeAll { $0.email == admin.email }
            status = "Admin deleted"
        }
    }

    func uploadImage(data: Data, filename: String = "image.jpg") async throws -> String {
        let uploadData: Data
        let uploadName: String

        if let image = UIImage(data: data), let jpeg = image.jpegData(compressionQuality: 0.88) {
            uploadData = jpeg
            uploadName = filename.hasSuffix(".jpg") || filename.hasSuffix(".jpeg") ? filename : "image.jpg"
        } else {
            uploadData = data
            uploadName = filename
        }

        let boundary = "Boundary-\(UUID().uuidString)"
        var body = Data()
        body.appendString("--\(boundary)\r\n")
        body.appendString("Content-Disposition: form-data; name=\"file\"; filename=\"\(uploadName)\"\r\n")
        body.appendString("Content-Type: image/jpeg\r\n\r\n")
        body.append(uploadData)
        body.appendString("\r\n--\(boundary)--\r\n")

        let response: UploadResponse = try await perform(
            "/api/admin/upload",
            method: "POST",
            body: body,
            contentType: "multipart/form-data; boundary=\(boundary)"
        )

        guard let url = response.url else {
            throw APIError(message: response.error ?? "Upload failed")
        }

        status = "Image uploaded"
        return url
    }

    private func run(_ loadingStatus: String, action: () async throws -> Void) async {
        isLoading = true
        status = loadingStatus
        do {
            try await action()
        } catch {
            status = error.localizedDescription
        }
        isLoading = false
    }

    private func perform<T: Decodable>(
        _ path: String,
        method: String = "GET",
        body: Data? = nil,
        contentType: String = "application/json"
    ) async throws -> T {
        var request = URLRequest(url: try endpoint(path))
        request.httpMethod = method
        request.httpBody = body
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if body != nil {
            request.setValue(contentType, forHTTPHeaderField: "Content-Type")
        }

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError(message: "Invalid server response")
        }

        guard (200..<300).contains(http.statusCode) else {
            let apiError = try? decoder.decode(ErrorResponse.self, from: data)
            let fallback = String(data: data, encoding: .utf8) ?? "Request failed"
            throw APIError(message: apiError?.error ?? fallback)
        }

        return try decoder.decode(T.self, from: data)
    }

    private func endpoint(_ path: String) throws -> URL {
        let cleanBase = baseURL.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: cleanBase + path) else {
            throw APIError(message: "Invalid server URL")
        }
        return url
    }
}

private extension Data {
    mutating func appendString(_ string: String) {
        append(Data(string.utf8))
    }
}

// MARK: - Root

struct RootView: View {
    @EnvironmentObject private var store: AdminStore

    var body: some View {
        Group {
            if store.isAuthenticated {
                AdminShellView()
            } else {
                LoginView()
            }
        }
        .tint(.cyan)
    }
}

struct LoginView: View {
    @EnvironmentObject private var store: AdminStore

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Server URL", text: $store.baseURL)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.URL)
                    TextField("Admin email", text: $store.email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                    SecureField("Password", text: $store.password)
                } header: {
                    Text("Connection")
                } footer: {
                    Text("Use https://raumwerkpro.de for production, or a local/LAN URL while testing.")
                }

                Section {
                    Button {
                        Task { await store.login() }
                    } label: {
                        Label(store.isLoading ? "Signing in..." : "Sign in", systemImage: "lock.open")
                    }
                    .disabled(store.isLoading)
                }

                Section {
                    Text(store.status)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("IBO Admin")
        }
    }
}

struct AdminShellView: View {
    @EnvironmentObject private var store: AdminStore

    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Home", systemImage: "gauge") }

            ContentControlView()
                .tabItem { Label("Website", systemImage: "slider.horizontal.3") }

            ChatListView()
                .tabItem { Label("Chat", systemImage: "bubble.left.and.bubble.right") }
                .badge(store.newChats)

            QuotesView()
                .tabItem { Label("Quotes", systemImage: "doc.text") }
                .badge(store.newQuotes)

            AdminsView()
                .tabItem { Label("Admins", systemImage: "person.2") }
        }
        .overlay(alignment: .bottom) {
            if store.isLoading {
                ProgressView(store.status)
                    .padding(12)
                    .background(.thinMaterial, in: Capsule())
                    .padding()
            }
        }
        .task {
            if store.content == nil {
                await store.refreshAll()
            }
            while !Task.isCancelled && store.isAuthenticated {
                await store.refreshInbox(silent: true)
                try? await Task.sleep(nanoseconds: 5_000_000_000)
            }
        }
    }
}

// MARK: - Dashboard

struct DashboardView: View {
    @EnvironmentObject private var store: AdminStore

    var body: some View {
        NavigationStack {
            List {
                Section("Live website") {
                    MetricRow(title: "Services", value: "\(store.serviceCount)", icon: "paintbrush")
                    MetricRow(title: "Cards", value: "\(store.cardCount)", icon: "rectangle.stack")
                    MetricRow(title: "New chats", value: "\(store.newChats)", icon: "bubble.left")
                    MetricRow(title: "New quotes", value: "\(store.newQuotes)", icon: "doc.text")
                }

                Section("Actions") {
                    Button {
                        Task { await store.saveContent() }
                    } label: {
                        Label("Save and publish website", systemImage: "square.and.arrow.down")
                    }

                    Button {
                        Task { await store.refreshAll() }
                    } label: {
                        Label("Refresh all data", systemImage: "arrow.clockwise")
                    }

                    if let url = URL(string: store.content?.company.url ?? "") {
                        Link(destination: url) {
                            Label("Open website", systemImage: "safari")
                        }
                    }
                }

                Section("Status") {
                    Text(store.status)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Control Center")
            .toolbar {
                Button("Logout") {
                    Task { await store.logout() }
                }
            }
            .refreshable {
                await store.refreshAll()
            }
        }
    }
}

struct MetricRow: View {
    var title: String
    var value: String
    var icon: String

    var body: some View {
        HStack {
            Label(title, systemImage: icon)
            Spacer()
            Text(value)
                .font(.title2.bold())
        }
    }
}

// MARK: - Content editor

enum ContentPanel: String, CaseIterable, Identifiable {
    case contact = "Contact"
    case settings = "Settings"
    case services = "Services"
    case cards = "Cards"
    case beforeAfter = "Before"

    var id: String { rawValue }
}

struct ContentControlView: View {
    @EnvironmentObject private var store: AdminStore
    @State private var panel: ContentPanel = .contact

    private var contentBinding: Binding<CmsContent>? {
        guard store.content != nil else { return nil }
        return Binding(
            get: { store.content! },
            set: { store.content = $0 }
        )
    }

    var body: some View {
        NavigationStack {
            Group {
                if let content = contentBinding {
                    Form {
                        Picker("Panel", selection: $panel) {
                            ForEach(ContentPanel.allCases) { item in
                                Text(item.rawValue).tag(item)
                            }
                        }
                        .pickerStyle(.segmented)

                        switch panel {
                        case .contact:
                            ContactEditor(content: content)
                        case .settings:
                            SettingsEditor(content: content)
                        case .services:
                            ServicesEditor(content: content)
                        case .cards:
                            CardsEditor(content: content)
                        case .beforeAfter:
                            BeforeAfterEditor(content: content)
                        }
                    }
                } else {
                    ProgressView("Loading website")
                }
            }
            .navigationTitle("Website Control")
            .toolbar {
                Button("Save") {
                    Task { await store.saveContent() }
                }
            }
            .refreshable {
                await store.refreshAll()
            }
        }
    }
}

struct ContactEditor: View {
    @Binding var content: CmsContent

    init(content: Binding<CmsContent>) {
        _content = content
    }

    var body: some View {
        Section("Company") {
            TextField("Company name", text: $content.company.name)
            TextField("Legal name", text: $content.company.legalName)
            TextField("Tagline", text: $content.company.tagline)
            TextField("Address", text: $content.company.address)
            TextField("Area", text: $content.company.area)
        }

        Section("Contact") {
            TextField("Visible phone", text: $content.company.phone)
            TextField("Phone link", text: $content.company.phoneHref)
            TextField("WhatsApp number", text: $content.company.whatsapp)
            TextField("Email", text: $content.company.email)
                .textInputAutocapitalization(.never)
                .keyboardType(.emailAddress)
                .onChange(of: content.company.email) { _, value in
                    content.company.emailHref = "mailto:\(value)"
                }
            TextField("Website URL", text: $content.company.url)
                .textInputAutocapitalization(.never)
                .keyboardType(.URL)
        }
    }
}

struct SettingsEditor: View {
    @Binding var content: CmsContent

    init(content: Binding<CmsContent>) {
        _content = content
    }

    var body: some View {
        Section("Live controls") {
            Toggle("WhatsApp floating button", isOn: $content.settings.whatsappFloating)
            Toggle("Chat widget", isOn: $content.settings.chatEnabled)
            Toggle("Quote form", isOn: $content.settings.quoteEnabled)
            Toggle("Before / after section", isOn: $content.settings.beforeAfterEnabled)
        }

        Section("Chat") {
            TextField("Chat greeting", text: $content.settings.chatGreeting, axis: .vertical)
        }

        Section("Hero image") {
            TextField("Hero image URL", text: $content.settings.heroImage)
            ImageUploadButton(title: "Upload / replace hero image") { url in
                content.settings.heroImage = url
            }
        }
    }
}

struct ServicesEditor: View {
    @Binding var content: CmsContent

    init(content: Binding<CmsContent>) {
        _content = content
    }

    var body: some View {
        Section {
            Button {
                content.services.insert(ServiceItem.empty(), at: 0)
            } label: {
                Label("Add service", systemImage: "plus.circle")
            }
        }

        Section("Services") {
            ForEach(content.services.indices, id: \.self) { index in
                NavigationLink {
                    ServiceDetailEditor(service: $content.services[index]) {
                        content.services.remove(at: index)
                    }
                } label: {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(content.services[index].title)
                        Text(content.services[index].slug)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .onDelete { offsets in
                content.services.remove(atOffsets: offsets)
            }
        }
    }
}

struct ServiceDetailEditor: View {
    @Binding var service: ServiceItem
    var delete: () -> Void

    var body: some View {
        Form {
            Section("Service") {
                TextField("Slug", text: $service.slug)
                    .textInputAutocapitalization(.never)
                TextField("Title", text: $service.title)
                TextField("Eyebrow", text: $service.eyebrow)
                TextField("Short text", text: $service.short, axis: .vertical)
                TextField("Summary", text: $service.summary, axis: .vertical)
            }

            Section("Image") {
                TextField("Image URL", text: $service.image)
                ImageUploadButton(title: "Upload / replace image") { url in
                    service.image = url
                }
            }

            Section("Icon and highlights") {
                Picker("Icon", selection: $service.iconName) {
                    ForEach(iconOptions, id: \.self) { icon in
                        Text(icon).tag(icon)
                    }
                }
                TextEditor(text: Binding(
                    get: { service.highlights.joined(separator: "\n") },
                    set: { service.highlights = $0.split(separator: "\n").map(String.init) }
                ))
                .frame(minHeight: 110)
            }

            Section("SEO") {
                TextField("SEO title", text: $service.seoTitle)
                TextField("SEO description", text: $service.seoDescription, axis: .vertical)
            }

            Section {
                Button(role: .destructive) {
                    delete()
                } label: {
                    Label("Delete service", systemImage: "trash")
                }
            }
        }
        .navigationTitle(service.title.isEmpty ? "Service" : service.title)
    }
}

struct CardsEditor: View {
    @Binding var content: CmsContent

    init(content: Binding<CmsContent>) {
        _content = content
    }

    var body: some View {
        Section {
            Button {
                content.projects.insert(ProjectCard.empty(), at: 0)
            } label: {
                Label("Add card", systemImage: "plus.circle")
            }
        }

        Section("Cards / projects") {
            ForEach(content.projects.indices, id: \.self) { index in
                NavigationLink {
                    ProjectDetailEditor(project: $content.projects[index]) {
                        content.projects.remove(at: index)
                    }
                } label: {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(content.projects[index].title)
                        Text(content.projects[index].category)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .onDelete { offsets in
                content.projects.remove(atOffsets: offsets)
            }
        }
    }
}

struct ProjectDetailEditor: View {
    @Binding var project: ProjectCard
    var delete: () -> Void

    var body: some View {
        Form {
            Section("Card") {
                TextField("Title", text: $project.title)
                TextField("Category", text: $project.category)
                TextField("Text", text: $project.text, axis: .vertical)
            }

            Section("Image") {
                TextField("Image URL", text: $project.image)
                ImageUploadButton(title: "Upload / replace image") { url in
                    project.image = url
                }
            }

            Section {
                Button(role: .destructive) {
                    delete()
                } label: {
                    Label("Delete card", systemImage: "trash")
                }
            }
        }
        .navigationTitle(project.title.isEmpty ? "Card" : project.title)
    }
}

struct BeforeAfterEditor: View {
    @Binding var content: CmsContent

    init(content: Binding<CmsContent>) {
        _content = content
    }

    var body: some View {
        Section("Before / after") {
            Toggle("Show section", isOn: $content.settings.beforeAfterEnabled)
            TextField("Title", text: $content.beforeAfter.title, axis: .vertical)
            TextField("Text", text: $content.beforeAfter.text, axis: .vertical)
            TextField("Before label", text: $content.beforeAfter.beforeLabel)
            TextField("After label", text: $content.beforeAfter.afterLabel)
        }

        Section("After image") {
            TextField("Image URL", text: $content.beforeAfter.afterImage)
            ImageUploadButton(title: "Upload / replace after image") { url in
                content.beforeAfter.afterImage = url
            }
        }
    }
}

// MARK: - Chat

struct ChatListView: View {
    @EnvironmentObject private var store: AdminStore

    var body: some View {
        NavigationStack {
            List {
                if store.messages.isEmpty {
                    ContentUnavailableView("No chat messages", systemImage: "bubble.left")
                }

                ForEach(store.messages) { message in
                    NavigationLink {
                        ChatDetailView(messageID: message.id)
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(message.name)
                                    .font(.headline)
                                Spacer()
                                StatusBadge(status: message.status)
                            }
                            Text(message.message)
                                .lineLimit(2)
                                .foregroundStyle(.secondary)
                            Text(message.email.isEmpty ? "No email" : message.email)
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                    }
                }
            }
            .navigationTitle("Chat")
            .toolbar {
                Button {
                    Task { await store.refreshInbox() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
            }
            .refreshable {
                await store.refreshInbox()
            }
        }
    }
}

struct ChatDetailView: View {
    @EnvironmentObject private var store: AdminStore
    var messageID: String
    @State private var replyText = ""

    private var message: ChatMessage? {
        store.messages.first { $0.id == messageID }
    }

    var body: some View {
        List {
            if let message {
                Section {
                    ChatBubble(author: "Customer", text: message.message, isAdmin: false)
                    ForEach(message.replies ?? []) { reply in
                        ChatBubble(
                            author: reply.author == "admin" ? "Admin" : "Customer",
                            text: reply.message,
                            isAdmin: reply.author == "admin"
                        )
                    }
                } header: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(message.name)
                        Text(message.email.isEmpty ? "No email" : message.email)
                    }
                }

                Section("Reply") {
                    TextEditor(text: $replyText)
                        .frame(minHeight: 130)

                    Button {
                        let text = replyText
                        replyText = ""
                        Task { await store.reply(to: message, text: text) }
                    } label: {
                        Label("Send reply", systemImage: "paperplane")
                    }
                    .disabled(replyText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                    if !message.email.isEmpty, let url = URL(string: "mailto:\(message.email)") {
                        Link(destination: url) {
                            Label("Email customer", systemImage: "envelope")
                        }
                    }
                }

                Section {
                    Button {
                        Task { await store.markMessage(message) }
                    } label: {
                        Label("Mark done", systemImage: "checkmark.circle")
                    }
                }
            } else {
                ContentUnavailableView("Message not found", systemImage: "exclamationmark.triangle")
            }
        }
        .navigationTitle("Conversation")
        .refreshable {
            await store.refreshInbox()
        }
    }
}

struct ChatBubble: View {
    var author: String
    var text: String
    var isAdmin: Bool

    var body: some View {
        HStack {
            if isAdmin { Spacer(minLength: 40) }
            VStack(alignment: .leading, spacing: 6) {
                Text(author.uppercased())
                    .font(.caption2.bold())
                    .foregroundStyle(.secondary)
                Text(text)
                    .font(.body)
            }
            .padding(12)
            .background(isAdmin ? Color.cyan.opacity(0.16) : Color.purple.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            if !isAdmin { Spacer(minLength: 40) }
        }
        .listRowSeparator(.hidden)
    }
}

struct StatusBadge: View {
    var status: String

    var body: some View {
        Text(status)
            .font(.caption.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(status == "new" ? Color.cyan.opacity(0.18) : Color.secondary.opacity(0.14))
            .clipShape(Capsule())
    }
}

// MARK: - Quotes

struct QuotesView: View {
    @EnvironmentObject private var store: AdminStore

    var body: some View {
        NavigationStack {
            List {
                if store.quotes.isEmpty {
                    ContentUnavailableView("No quote requests", systemImage: "doc.text")
                }

                ForEach(store.quotes) { quote in
                    Section {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(quote.name)
                                    .font(.headline)
                                Spacer()
                                StatusBadge(status: quote.status)
                            }
                            Text(quote.message)
                            Label(quote.phone, systemImage: "phone")
                            if !quote.email.isEmpty {
                                Label(quote.email, systemImage: "envelope")
                            }
                            Button {
                                Task { await store.markQuote(quote) }
                            } label: {
                                Label("Mark done", systemImage: "checkmark.circle")
                            }
                        }
                    }
                }
            }
            .navigationTitle("Quotes")
            .toolbar {
                Button {
                    Task { await store.refreshInbox() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
            }
            .refreshable {
                await store.refreshInbox()
            }
        }
    }
}

// MARK: - Admins

struct AdminsView: View {
    @EnvironmentObject private var store: AdminStore
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Add admin") {
                    TextField("Email", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                    SecureField("Password", text: $password)
                    Button {
                        let newEmail = email
                        let newPassword = password
                        email = ""
                        password = ""
                        Task { await store.addAdmin(email: newEmail, password: newPassword) }
                    } label: {
                        Label("Add admin", systemImage: "person.badge.plus")
                    }
                    .disabled(email.isEmpty || password.isEmpty)
                }

                Section("Admins") {
                    ForEach(store.admins) { admin in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(admin.email)
                                Text(admin.createdAt)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                        }
                        .swipeActions {
                            Button(role: .destructive) {
                                Task { await store.deleteAdmin(admin) }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
            }
            .navigationTitle("Admins")
            .refreshable {
                await store.refreshAll()
            }
        }
    }
}

// MARK: - Shared controls

struct ImageUploadButton: View {
    @EnvironmentObject private var store: AdminStore
    var title: String
    var onUploaded: (String) -> Void
    @State private var selectedItem: PhotosPickerItem?
    @State private var isUploading = false

    var body: some View {
        PhotosPicker(selection: $selectedItem, matching: .images) {
            Label(isUploading ? "Uploading..." : title, systemImage: "photo")
        }
        .disabled(isUploading)
        .onChange(of: selectedItem) { _, item in
            guard let item else { return }
            Task {
                isUploading = true
                defer {
                    isUploading = false
                    selectedItem = nil
                }

                do {
                    if let data = try await item.loadTransferable(type: Data.self) {
                        let url = try await store.uploadImage(data: data)
                        onUploaded(url)
                    }
                } catch {
                    store.status = error.localizedDescription
                }
            }
        }
    }
}

let iconOptions = [
    "PaintRoller",
    "Wallpaper",
    "WandSparkles",
    "Layers3",
    "PanelTop",
    "Ruler",
    "Construction",
    "SprayCan",
    "BugOff",
    "CalendarCheck",
    "ShieldCheck",
    "Gem",
    "MessageCircle",
    "Calculator",
    "ClipboardCheck",
    "Building2",
    "ScanLine",
    "Hammer",
    "Palette",
    "Check",
    "Sparkles"
]
