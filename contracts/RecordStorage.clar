(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-RECORD-HASH u101)
(define-constant ERR-INVALID-TITLE u102)
(define-constant ERR-INVALID-TIMESTAMP u103)
(define-constant ERR-RECORD-ALREADY-EXISTS u104)
(define-constant ERR-RECORD-NOT-FOUND u105)
(define-constant ERR-INVALID-METADATA u106)
(define-constant ERR-INVALID-CATEGORY u107)
(define-constant ERR-INVALID-SIZE u108)
(define-constant ERR-INVALID-STATUS u109)
(define-constant ERR-MAX-RECORDS-EXCEEDED u110)
(define-constant ERR-INVALID-ENCRYPTION-KEY u111)
(define-constant ERR-INVALID-AUTHORITY u112)
(define-constant ERR-INVALID-VERSION u113)

(define-data-var next-record-id uint u0)
(define-data-var max-records uint u10000)
(define-data-var authority-contract (optional principal) none)

(define-map records
  { record-id: uint }
  { owner: principal, record-hash: (buff 32), title: (string-utf8 100), timestamp: uint, category: (string-utf8 50), size: uint, status: bool, encryption-key: (buff 32), version: uint })

(define-map records-by-hash
  { record-hash: (buff 32) }
  { record-id: uint })

(define-map record-metadata
  { record-id: uint }
  { description: (string-utf8 500), last-updated: uint, access-count: uint })

(define-read-only (get-record (record-id uint))
  (map-get? records { record-id: record-id }))

(define-read-only (get-record-by-hash (record-hash (buff 32)))
  (match (map-get? records-by-hash { record-hash: record-hash })
    entry (map-get? records { record-id: (get record-id entry) })
    none))

(define-read-only (get-record-metadata (record-id uint))
  (map-get? record-metadata { record-id: record-id }))

(define-read-only (is-record-registered (record-hash (buff 32)))
  (is-some (map-get? records-by-hash { record-hash: record-hash })))

(define-read-only (get-record-count)
  (ok (var-get next-record-id)))

(define-private (validate-record-hash (record-hash (buff 32)))
  (if (is-eq (len record-hash) u32)
      (ok true)
      (err ERR-INVALID-RECORD-HASH)))

(define-private (validate-title (title (string-utf8 100)))
  (if (and (> (len title) u0) (<= (len title) u100))
      (ok true)
      (err ERR-INVALID-TITLE)))

(define-private (validate-timestamp (timestamp uint))
  (if (>= timestamp block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP)))

(define-private (validate-category (category (string-utf8 50)))
  (if (or (is-eq category u"lab-results") (is-eq category u"prescriptions") (is-eq category u"diagnoses") (is-eq category u"imaging"))
      (ok true)
      (err ERR-INVALID-CATEGORY)))

(define-private (validate-size (size uint))
  (if (<= size u1048576)
      (ok true)
      (err ERR-INVALID-SIZE)))

(define-private (validate-status (status bool))
  (ok true))

(define-private (validate-encryption-key (key (buff 32)))
  (if (is-eq (len key) u32)
      (ok true)
      (err ERR-INVALID-ENCRYPTION-KEY)))

(define-private (validate-version (version uint))
  (if (<= version u100)
      (ok true)
      (err ERR-INVALID-VERSION)))

(define-private (validate-description (description (string-utf8 500)))
  (if (<= (len description) u500)
      (ok true)
      (err ERR-INVALID-METADATA)))

(define-private (validate-principal (p principal))
  (if (not (is-eq p 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-INVALID-AUTHORITY)))

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-INVALID-AUTHORITY))
    (var-set authority-contract (some contract-principal))
    (ok true)))

(define-public (store-record
  (record-hash (buff 32))
  (title (string-utf8 100))
  (timestamp uint)
  (category (string-utf8 50))
  (size uint)
  (status bool)
  (encryption-key (buff 32))
  (version uint)
  (description (string-utf8 500)))
  (let
    ((record-id (var-get next-record-id))
     (caller tx-sender))
    (asserts! (< record-id (var-get max-records)) (err ERR-MAX-RECORDS-EXCEEDED))
    (try! (validate-record-hash record-hash))
    (try! (validate-title title))
    (try! (validate-timestamp timestamp))
    (try! (validate-category category))
    (try! (validate-size size))
    (try! (validate-status status))
    (try! (validate-encryption-key encryption-key))
    (try! (validate-version version))
    (try! (validate-description description))
    (asserts! (is-none (map-get? records-by-hash { record-hash: record-hash })) (err ERR-RECORD-ALREADY-EXISTS))
    (map-set records
      { record-id: record-id }
      { owner: caller, record-hash: record-hash, title: title, timestamp: timestamp, category: category, size: size, status: status, encryption-key: encryption-key, version: version })
    (map-set records-by-hash
      { record-hash: record-hash }
      { record-id: record-id })
    (map-set record-metadata
      { record-id: record-id }
      { description: description, last-updated: block-height, access-count: u0 })
    (var-set next-record-id (+ record-id u1))
    (print { event: "record-stored", id: record-id })
    (ok record-id)))

(define-public (update-record-metadata
  (record-id uint)
  (new-title (string-utf8 100))
  (new-description (string-utf8 500))
  (new-category (string-utf8 50))
  (new-status bool))
  (let
    ((record (map-get? records { record-id: record-id }))
     (metadata (map-get? record-metadata { record-id: record-id })))
    (match record
      r
      (begin
        (asserts! (is-eq (get owner r) tx-sender) (err ERR-NOT-AUTHORIZED))
        (try! (validate-title new-title))
        (try! (validate-category new-category))
        (try! (validate-description new-description))
        (try! (validate-status new-status))
        (map-set records
          { record-id: record-id }
          { owner: (get owner r), record-hash: (get record-hash r), title: new-title, timestamp: (get timestamp r), category: new-category, size: (get size r), status: new-status, encryption-key: (get encryption-key r), version: (get version r) })
        (map-set record-metadata
          { record-id: record-id }
          { description: new-description, last-updated: block-height, access-count: (get access-count metadata) })
        (print { event: "record-metadata-updated", id: record-id })
        (ok true))
      (err ERR-RECORD-NOT-FOUND))))

(define-public (increment-access-count (record-id uint))
  (let
    ((record (map-get? records { record-id: record-id }))
     (metadata (map-get? record-metadata { record-id: record-id })))
    (match record
      r
      (match metadata
        m
        (begin
          (map-set record-metadata
            { record-id: record-id }
            { description: (get description m), last-updated: (get last-updated m), access-count: (+ (get access-count m) u1) })
          (print { event: "access-count-incremented", id: record-id })
          (ok true))
        (err ERR-INVALID-METADATA))
      (err ERR-RECORD-NOT-FOUND))))