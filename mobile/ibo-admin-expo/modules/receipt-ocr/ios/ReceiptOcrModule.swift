import ExpoModulesCore
import PDFKit
import UIKit
import Vision

public class ReceiptOcrModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ReceiptOcr")

    AsyncFunction("recognizeText") { (uri: String, promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          promise.resolve(try Self.recognize(uri: uri))
        } catch {
          promise.reject("ERR_RECEIPT_OCR", error.localizedDescription)
        }
      }
    }
  }

  private static func fileURL(_ uri: String) -> URL {
    if let url = URL(string: uri), url.scheme != nil {
      return url
    }
    return URL(fileURLWithPath: uri)
  }

  private static func recognize(uri: String) throws -> [[String: Any]] {
    let url = fileURL(uri)

    if url.pathExtension.lowercased() == "pdf" {
      guard let document = PDFDocument(url: url) else {
        throw OcrError.unreadable
      }
      let embedded = embeddedPdfLines(document)
      if !embedded.isEmpty {
        return embedded
      }
      var lines: [[String: Any]] = []
      let pageCount = min(document.pageCount, 3)
      for index in 0..<pageCount {
        guard let page = document.page(at: index), let image = render(page: page) else { continue }
        let pageLines = try recognize(cgImage: image, orientation: .up)
        lines.append(contentsOf: offset(pageLines, page: index, pages: pageCount))
      }
      return lines
    }

    let data = try Data(contentsOf: url)
    guard let image = UIImage(data: data), let cgImage = image.cgImage else {
      throw OcrError.unreadable
    }
    return try recognize(cgImage: cgImage, orientation: orientation(of: image))
  }

  private static func recognize(cgImage: CGImage, orientation: CGImagePropertyOrientation) throws -> [[String: Any]] {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.recognitionLanguages = ["de-DE", "en-US"]

    let handler = VNImageRequestHandler(cgImage: cgImage, orientation: orientation, options: [:])
    try handler.perform([request])

    let observations = request.results ?? []
    return observations.compactMap { observation in
      guard let candidate = observation.topCandidates(1).first else { return nil }
      let box = observation.boundingBox
      return [
        "text": candidate.string,
        "x": box.minX,
        "y": 1 - box.maxY,
        "width": box.width,
        "height": box.height,
      ]
    }
  }

  /// Text-based PDFs (e.g. invoices from online shops) already carry their text, so no OCR is needed.
  private static func embeddedPdfLines(_ document: PDFDocument) -> [[String: Any]] {
    var result: [[String: Any]] = []
    let pageCount = min(document.pageCount, 3)
    for index in 0..<pageCount {
      guard let text = document.page(at: index)?.string else { continue }
      let lines = text
        .components(separatedBy: .newlines)
        .map { $0.trimmingCharacters(in: .whitespaces) }
        .filter { !$0.isEmpty }
      for (lineIndex, line) in lines.enumerated() {
        let y = (Double(index) + Double(lineIndex) / Double(max(lines.count, 1))) / Double(pageCount)
        result.append(["text": line, "x": 0, "y": y, "width": 1, "height": 0.5 / Double(max(lines.count, 1) * pageCount)])
      }
    }
    return result
  }

  private static func render(page: PDFPage) -> CGImage? {
    let bounds = page.bounds(for: .mediaBox)
    let scale: CGFloat = 2.5
    let size = CGSize(width: bounds.width * scale, height: bounds.height * scale)
    let renderer = UIGraphicsImageRenderer(size: size)
    let image = renderer.image { context in
      UIColor.white.setFill()
      context.fill(CGRect(origin: .zero, size: size))
      context.cgContext.translateBy(x: 0, y: size.height)
      context.cgContext.scaleBy(x: scale, y: -scale)
      page.draw(with: .mediaBox, to: context.cgContext)
    }
    return image.cgImage
  }

  private static func offset(_ lines: [[String: Any]], page: Int, pages: Int) -> [[String: Any]] {
    lines.map { line in
      var copy = line
      if let y = line["y"] as? CGFloat, let height = line["height"] as? CGFloat {
        copy["y"] = (CGFloat(page) + y) / CGFloat(pages)
        copy["height"] = height / CGFloat(pages)
      }
      return copy
    }
  }

  private static func orientation(of image: UIImage) -> CGImagePropertyOrientation {
    switch image.imageOrientation {
    case .up: return .up
    case .down: return .down
    case .left: return .left
    case .right: return .right
    case .upMirrored: return .upMirrored
    case .downMirrored: return .downMirrored
    case .leftMirrored: return .leftMirrored
    case .rightMirrored: return .rightMirrored
    @unknown default: return .up
    }
  }

  private enum OcrError: LocalizedError {
    case unreadable

    var errorDescription: String? {
      "Die Datei konnte nicht gelesen werden."
    }
  }
}
