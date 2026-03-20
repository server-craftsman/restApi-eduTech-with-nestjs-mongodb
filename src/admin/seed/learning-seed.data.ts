import { CourseType } from '../../enums';

export interface LessonSeedTemplate {
  title: string;
  description: string;
  keyConcept: string;
  practiceContext: string;
  videoDurationSeconds: number;
  /**
   * Optional explicit video asset for this lesson.
   * If omitted, seed service will auto-generate a deterministic Cloudinary URL.
   */
  video?: {
    publicId: string;
    url: string;
    fileSize?: number;
  };
}

export interface ChapterSeedTemplate {
  title: string;
  description: string;
  lessons: LessonSeedTemplate[];
}

export interface CourseSeedTemplate {
  subjectName: string;
  subjectIconUrl: { publicId: string; url: string };
  title: string;
  description: string;
  thumbnailUrl: { publicId: string; url: string };
  type: CourseType;
  chapters: ChapterSeedTemplate[];
}

export const VIETNAM_GRADE_VALUE = 10;
export const VIETNAM_GRADE_NAME = 'Lớp 10';

const BASE_VIETNAM_LEARNING_SEED: CourseSeedTemplate[] = [
  {
    subjectName: 'Toán học',
    subjectIconUrl: {
      publicId: 'edutech/subjects/nvykm35pcz2wchxemdix',
      url: 'https://res.cloudinary.com/dym0se5if/image/upload/v1773988210/edutech/subjects/nvykm35pcz2wchxemdix.jpg',
    },
    title: 'Toán 10 - Nền tảng hàm số và phương trình',
    description:
      'Khóa học giúp học sinh lớp 10 nắm vững hàm số, phương trình và ứng dụng thực tế trong các bài toán học đường tại Việt Nam.',
    thumbnailUrl: {
      publicId: 'edutech/subjects/xf3iesropa2bjcn0bses',
      url: 'https://res.cloudinary.com/dym0se5if/image/upload/v1773988318/edutech/subjects/xf3iesropa2bjcn0bses.png',
    },
    type: CourseType.Free,
    chapters: [
      {
        title: 'Chương 1 - Mệnh đề và tập hợp',
        description: 'Nền tảng tư duy logic cho môn Toán lớp 10.',
        lessons: [
          {
            title: 'Mệnh đề toán học và giá trị đúng sai',
            description: 'Nhận diện mệnh đề đúng, sai và phủ định mệnh đề.',
            keyConcept: 'mệnh đề',
            practiceContext: 'phân tích phát biểu trong đề thi giữa kỳ',
            videoDurationSeconds: 780,
          },
          {
            title: 'Tập hợp và các phép toán cơ bản',
            description: 'Hợp, giao, hiệu và phần bù của tập hợp.',
            keyConcept: 'tập hợp',
            practiceContext: 'phân loại nhóm học sinh theo năng lực',
            videoDurationSeconds: 840,
          },
          {
            title: 'Các tập số và khoảng trên trục số',
            description: 'Biểu diễn khoảng, đoạn và nửa khoảng trên trục số.',
            keyConcept: 'khoảng',
            practiceContext: 'đọc dữ liệu điểm số theo khoảng',
            videoDurationSeconds: 810,
          },
        ],
      },
      {
        title: 'Chương 2 - Hàm số bậc nhất và bậc hai',
        description: 'Hiểu và vẽ đồ thị hàm số cơ bản.',
        lessons: [
          {
            title: 'Khái niệm hàm số và đồ thị',
            description: 'Ôn tập miền xác định và tập giá trị.',
            keyConcept: 'hàm số',
            practiceContext: 'mô tả chi phí gửi xe theo số giờ',
            videoDurationSeconds: 900,
          },
          {
            title: 'Hàm số bậc nhất y = ax + b',
            description: 'Nhận dạng hệ số góc và giao điểm trục tung.',
            keyConcept: 'hệ số góc',
            practiceContext: 'ước lượng doanh thu quán trà sữa theo ngày',
            videoDurationSeconds: 930,
          },
          {
            title: 'Hàm số bậc hai và parabol',
            description: 'Xác định đỉnh và trục đối xứng của parabol.',
            keyConcept: 'parabol',
            practiceContext: 'mô phỏng quỹ đạo ném bóng trong giờ thể dục',
            videoDurationSeconds: 960,
          },
        ],
      },
      {
        title: 'Chương 3 - Phương trình và hệ phương trình',
        description: 'Giải và ứng dụng phương trình trong bài toán thực tế.',
        lessons: [
          {
            title: 'Phương trình bậc nhất một ẩn',
            description: 'Các bước biến đổi tương đương và kiểm tra nghiệm.',
            keyConcept: 'nghiệm',
            practiceContext: 'tính số vé xe buýt học sinh đã bán',
            videoDurationSeconds: 870,
          },
          {
            title: 'Phương trình bậc hai một ẩn',
            description: 'Công thức nghiệm và biệt thức Delta.',
            keyConcept: 'delta',
            practiceContext: 'tính kích thước sân trường theo mô hình',
            videoDurationSeconds: 930,
          },
          {
            title: 'Hệ hai phương trình bậc nhất hai ẩn',
            description: 'Phương pháp thế và cộng đại số.',
            keyConcept: 'hệ phương trình',
            practiceContext: 'tính tiền điện nước của lớp học',
            videoDurationSeconds: 920,
          },
        ],
      },
    ],
  },
  {
    subjectName: 'Ngữ văn',
    subjectIconUrl: {
      publicId: 'edutech/subjects/tvzegn7suoax0ceshdxt',
      url: 'https://res.cloudinary.com/dym0se5if/image/upload/v1773988359/edutech/subjects/tvzegn7suoax0ceshdxt.png',
    },
    title: 'Ngữ văn 10 - Đọc hiểu và viết nghị luận',
    description:
      'Khóa học bám sát chương trình GDPT 2018, rèn kỹ năng đọc hiểu văn bản và viết bài nghị luận xã hội cho học sinh lớp 10.',
    thumbnailUrl: {
      publicId: 'edutech/subjects/eioaysyoetj9qshqocxy',
      url: 'https://res.cloudinary.com/dym0se5if/image/upload/v1773988447/edutech/subjects/eioaysyoetj9qshqocxy.webp',
    },
    type: CourseType.Free,
    chapters: [
      {
        title: 'Chương 1 - Đọc hiểu văn bản',
        description: 'Xác định nội dung, chủ đề và nghệ thuật văn bản.',
        lessons: [
          {
            title: 'Xác định chủ đề văn bản',
            description: 'Nhận diện chủ đề và thông điệp chính.',
            keyConcept: 'chủ đề',
            practiceContext: 'đọc hiểu truyện ngắn Việt Nam hiện đại',
            videoDurationSeconds: 760,
          },
          {
            title: 'Phân tích biện pháp tu từ',
            description: 'So sánh, ẩn dụ, nhân hóa trong đoạn thơ.',
            keyConcept: 'biện pháp tu từ',
            practiceContext: 'phân tích thơ trong đề thi học kỳ',
            videoDurationSeconds: 820,
          },
          {
            title: 'Suy luận ý nghĩa hàm ẩn',
            description: 'Đọc giữa các dòng để hiểu dụng ý tác giả.',
            keyConcept: 'hàm ẩn',
            practiceContext: 'trả lời câu hỏi đọc hiểu 3 điểm',
            videoDurationSeconds: 800,
          },
        ],
      },
      {
        title: 'Chương 2 - Viết đoạn và bài nghị luận xã hội',
        description: 'Kỹ năng viết mạch lạc, có luận điểm rõ ràng.',
        lessons: [
          {
            title: 'Xây dựng luận điểm và luận cứ',
            description: 'Tổ chức ý cho đoạn văn nghị luận xã hội.',
            keyConcept: 'luận điểm',
            practiceContext: 'viết đoạn văn về ý thức tự học',
            videoDurationSeconds: 850,
          },
          {
            title: 'Dẫn chứng thuyết phục trong bài viết',
            description: 'Chọn dẫn chứng gần gũi, đúng vấn đề.',
            keyConcept: 'dẫn chứng',
            practiceContext: 'liên hệ việc sử dụng mạng xã hội',
            videoDurationSeconds: 880,
          },
          {
            title: 'Liên kết câu và đoạn trong văn bản',
            description: 'Dùng phép lặp, phép nối, phép thế hợp lý.',
            keyConcept: 'liên kết',
            practiceContext: 'chỉnh sửa bài viết trước khi nộp',
            videoDurationSeconds: 790,
          },
        ],
      },
      {
        title: 'Chương 3 - Kỹ năng làm bài kiểm tra Ngữ văn',
        description: 'Tối ưu điểm số trong bài kiểm tra trên lớp.',
        lessons: [
          {
            title: 'Phân bổ thời gian khi làm bài',
            description: 'Chia thời gian hợp lý giữa đọc hiểu và viết.',
            keyConcept: 'phân bổ thời gian',
            practiceContext: 'làm bài 90 phút ở trường',
            videoDurationSeconds: 740,
          },
          {
            title: 'Tránh lỗi diễn đạt thường gặp',
            description: 'Khắc phục lỗi câu dài, lủng củng và sai ý.',
            keyConcept: 'diễn đạt',
            practiceContext: 'sửa bài kiểm tra giữa kỳ',
            videoDurationSeconds: 770,
          },
          {
            title: 'Ôn tập theo ma trận đề thi',
            description: 'Lập kế hoạch ôn tập theo trọng tâm.',
            keyConcept: 'ma trận đề',
            practiceContext: 'ôn thi cuối kỳ theo tuần',
            videoDurationSeconds: 810,
          },
        ],
      },
    ],
  },
  {
    subjectName: 'Vật lý',
    subjectIconUrl: {
      publicId: 'edutech/subjects/un6szcihzh3dovphktti',
      url: 'https://res.cloudinary.com/dym0se5if/image/upload/v1773988556/edutech/subjects/un6szcihzh3dovphktti.jpg',
    },
    title: 'Vật lý 10 - Chuyển động và lực trong đời sống',
    description:
      'Khóa học giúp học sinh hiểu bản chất chuyển động, lực và năng lượng qua các ví dụ thực tế tại Việt Nam.',
    thumbnailUrl: {
      publicId: 'edutech/subjects/wllhppzzlbjkkkaylrfj',
      url: 'https://res.cloudinary.com/dym0se5if/image/upload/v1773988654/edutech/subjects/wllhppzzlbjkkkaylrfj.jpg',
    },
    type: CourseType.Premium,
    chapters: [
      {
        title: 'Chương 1 - Mô tả chuyển động',
        description: 'Vận tốc, quãng đường và đồ thị chuyển động.',
        lessons: [
          {
            title: 'Chuyển động thẳng đều',
            description: 'Phân tích công thức s = v.t trong thực tế.',
            keyConcept: 'vận tốc',
            practiceContext: 'ước tính thời gian đi học bằng xe buýt',
            videoDurationSeconds: 860,
          },
          {
            title: 'Đồ thị tọa độ - thời gian',
            description: 'Đọc và suy luận từ đồ thị chuyển động.',
            keyConcept: 'đồ thị',
            practiceContext: 'so sánh lộ trình hai bạn học sinh',
            videoDurationSeconds: 900,
          },
          {
            title: 'Chuyển động thẳng biến đổi đều',
            description: 'Gia tốc và ý nghĩa vật lý.',
            keyConcept: 'gia tốc',
            practiceContext: 'xe máy tăng tốc khi rời đèn đỏ',
            videoDurationSeconds: 920,
          },
        ],
      },
      {
        title: 'Chương 2 - Các định luật Newton',
        description: 'Mối liên hệ giữa lực và chuyển động.',
        lessons: [
          {
            title: 'Định luật I Newton',
            description: 'Quán tính và trạng thái cân bằng.',
            keyConcept: 'quán tính',
            practiceContext: 'hành khách nghiêng người khi xe phanh',
            videoDurationSeconds: 780,
          },
          {
            title: 'Định luật II Newton',
            description: 'Công thức F = m.a và ứng dụng.',
            keyConcept: 'lực',
            practiceContext: 'đẩy xe hàng trong siêu thị',
            videoDurationSeconds: 860,
          },
          {
            title: 'Định luật III Newton',
            description: 'Lực và phản lực trong tương tác.',
            keyConcept: 'phản lực',
            practiceContext: 'bơi lội và chuyển động trong nước',
            videoDurationSeconds: 820,
          },
        ],
      },
      {
        title: 'Chương 3 - Công, công suất và năng lượng',
        description: 'Hiểu năng lượng trong hoạt động hàng ngày.',
        lessons: [
          {
            title: 'Khái niệm công cơ học',
            description: 'Tính công khi có lực và độ dời.',
            keyConcept: 'công cơ học',
            practiceContext: 'kéo vali khi đi du lịch',
            videoDurationSeconds: 840,
          },
          {
            title: 'Công suất và hiệu suất',
            description: 'So sánh hiệu quả của các thiết bị.',
            keyConcept: 'công suất',
            practiceContext: 'chọn quạt điện tiết kiệm điện',
            videoDurationSeconds: 870,
          },
          {
            title: 'Định luật bảo toàn cơ năng',
            description: 'Liên hệ thế năng và động năng.',
            keyConcept: 'cơ năng',
            practiceContext: 'trò chơi tàu lượn trong công viên',
            videoDurationSeconds: 930,
          },
        ],
      },
    ],
  },
  {
    subjectName: 'Hóa học',
    subjectIconUrl: {
      publicId: 'edutech/subjects/qmgsposghidotwv19wgv',
      url: 'https://res.cloudinary.com/dym0se5if/image/upload/v1773988828/edutech/subjects/qmgsposghidotwv19wgv.jpg',
    },
    title: 'Hóa học 10 - Nguyên tử, liên kết và phản ứng',
    description:
      'Khóa học cung cấp nền tảng Hóa học 10 với ví dụ đời sống như xử lý nước, vật liệu và an toàn trong phòng thí nghiệm.',
    thumbnailUrl: {
      publicId: 'edutech/subjects/tarheaeyxxsg9olj5k2o',
      url: 'https://res.cloudinary.com/dym0se5if/image/upload/v1773988902/edutech/subjects/tarheaeyxxsg9olj5k2o.png',
    },
    type: CourseType.Premium,
    chapters: [
      {
        title: 'Chương 1 - Cấu tạo nguyên tử',
        description: 'Electron, proton, neutron và cấu hình electron.',
        lessons: [
          {
            title: 'Thành phần của nguyên tử',
            description: 'Phân biệt proton, neutron và electron.',
            keyConcept: 'nguyên tử',
            practiceContext: 'giải thích tính chất vật chất hằng ngày',
            videoDurationSeconds: 840,
          },
          {
            title: 'Số hiệu nguyên tử và số khối',
            description: 'Mối liên hệ giữa Z và A.',
            keyConcept: 'số khối',
            practiceContext: 'đọc thông tin trong bảng tuần hoàn',
            videoDurationSeconds: 810,
          },
          {
            title: 'Cấu hình electron cơ bản',
            description: 'Viết cấu hình electron cho nguyên tố đơn giản.',
            keyConcept: 'cấu hình electron',
            practiceContext: 'dự đoán tính kim loại của nguyên tố',
            videoDurationSeconds: 900,
          },
        ],
      },
      {
        title: 'Chương 2 - Liên kết hóa học',
        description: 'Liên kết ion, cộng hóa trị và kim loại.',
        lessons: [
          {
            title: 'Liên kết ion',
            description: 'Sự cho nhận electron giữa các nguyên tử.',
            keyConcept: 'liên kết ion',
            practiceContext: 'giải thích tính tan của muối ăn',
            videoDurationSeconds: 820,
          },
          {
            title: 'Liên kết cộng hóa trị',
            description: 'Sự dùng chung electron.',
            keyConcept: 'liên kết cộng hóa trị',
            practiceContext: 'phân tích phân tử nước và CO2',
            videoDurationSeconds: 840,
          },
          {
            title: 'Độ âm điện và phân cực liên kết',
            description: 'Nhận diện liên kết phân cực, không phân cực.',
            keyConcept: 'độ âm điện',
            practiceContext: 'giải thích tính chất dung môi',
            videoDurationSeconds: 850,
          },
        ],
      },
      {
        title: 'Chương 3 - Phản ứng hóa học',
        description: 'Bản chất phản ứng và cân bằng phương trình.',
        lessons: [
          {
            title: 'Phản ứng oxi hóa - khử',
            description: 'Số oxi hóa và chất khử/chất oxi hóa.',
            keyConcept: 'oxi hóa - khử',
            practiceContext: 'ăn mòn kim loại trong môi trường ẩm',
            videoDurationSeconds: 900,
          },
          {
            title: 'Cân bằng phương trình hóa học',
            description: 'Bảo toàn nguyên tố trong phản ứng.',
            keyConcept: 'cân bằng phương trình',
            practiceContext: 'điều chế khí trong phòng thí nghiệm',
            videoDurationSeconds: 920,
          },
          {
            title: 'Tốc độ phản ứng và xúc tác',
            description: 'Các yếu tố ảnh hưởng tốc độ phản ứng.',
            keyConcept: 'xúc tác',
            practiceContext: 'bảo quản thực phẩm và dược phẩm',
            videoDurationSeconds: 840,
          },
        ],
      },
    ],
  },
  {
    subjectName: 'Tiếng Anh',
    subjectIconUrl: {
      publicId: 'edutech/subjects/vwtkoayogsdm8lgy5hfg',
      url: 'https://res.cloudinary.com/dym0se5if/image/upload/v1773988982/edutech/subjects/vwtkoayogsdm8lgy5hfg.webp',
    },
    title: 'Tiếng Anh 10 - Communication & Grammar in Context',
    description:
      'Khóa học giúp học sinh lớp 10 cải thiện từ vựng, ngữ pháp và kỹ năng giao tiếp trong bối cảnh học tập và đời sống tại Việt Nam.',
    thumbnailUrl: {
      publicId: 'edutech/subjects/bejztbvbpns8mygo9ij2',
      url: 'https://res.cloudinary.com/dym0se5if/image/upload/v1773989050/edutech/subjects/bejztbvbpns8mygo9ij2.jpg',
    },
    type: CourseType.Free,
    chapters: [
      {
        title: 'Chapter 1 - Daily Communication',
        description: 'Common speaking patterns in school life.',
        lessons: [
          {
            title: 'Introducing yourself confidently',
            description: 'Useful sentence structures for self-introduction.',
            keyConcept: 'self-introduction',
            practiceContext: 'introducing yourself in a new class',
            videoDurationSeconds: 760,
          },
          {
            title: 'Asking for and giving directions',
            description: 'Language for guiding people around town.',
            keyConcept: 'directions',
            practiceContext: 'showing a tourist around Ho Chi Minh City',
            videoDurationSeconds: 800,
          },
          {
            title: 'Making polite requests',
            description: 'Using modal verbs for polite communication.',
            keyConcept: 'polite requests',
            practiceContext: 'asking a teacher for assignment feedback',
            videoDurationSeconds: 790,
          },
        ],
      },
      {
        title: 'Chapter 2 - Core Grammar for Grade 10',
        description: 'Grammar structures frequently tested at school.',
        lessons: [
          {
            title: 'Present tenses in real contexts',
            description: 'Simple present vs present continuous.',
            keyConcept: 'present tense',
            practiceContext: 'describing your weekly study routine',
            videoDurationSeconds: 860,
          },
          {
            title: 'Past tense and storytelling',
            description: 'Narrating events clearly in English.',
            keyConcept: 'past tense',
            practiceContext: 'telling a memorable school event',
            videoDurationSeconds: 840,
          },
          {
            title: 'Future forms and plans',
            description: 'Will, be going to and present continuous for future.',
            keyConcept: 'future plans',
            practiceContext: 'planning for a class field trip',
            videoDurationSeconds: 830,
          },
        ],
      },
      {
        title: 'Chapter 3 - Reading and Writing Skills',
        description: 'Reading comprehension and paragraph writing.',
        lessons: [
          {
            title: 'Skimming and scanning techniques',
            description: 'Read texts faster and find key information.',
            keyConcept: 'skimming',
            practiceContext: 'reading short passages in school tests',
            videoDurationSeconds: 770,
          },
          {
            title: 'Building coherent paragraphs',
            description: 'Topic sentence, supporting details, conclusion.',
            keyConcept: 'coherence',
            practiceContext: 'writing about environmental protection',
            videoDurationSeconds: 820,
          },
          {
            title: 'Email writing for academic purposes',
            description: 'Formal and semi-formal email structures.',
            keyConcept: 'email writing',
            practiceContext: 'emailing your teacher for consultation',
            videoDurationSeconds: 780,
          },
        ],
      },
    ],
  },
];

const toSlug = (input: string): string =>
  input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Ensure every lesson in the seed has a video object.
 * - Keep existing `lesson.video` if already provided manually.
 * - Auto-generate deterministic Cloudinary video URL if missing.
 */
export const VIETNAM_LEARNING_SEED: CourseSeedTemplate[] =
  BASE_VIETNAM_LEARNING_SEED.map((course) => ({
    ...course,
    chapters: course.chapters.map((chapter) => ({
      ...chapter,
      lessons: chapter.lessons.map((lesson) => {
        if (lesson.video?.publicId && lesson.video?.url) {
          return lesson;
        }

        const slug = toSlug(
          `${course.subjectName}-${chapter.title}-${lesson.title}`,
        );

        return {
          ...lesson,
          video: {
            publicId: `edutech/lessons/${slug}`,
            url: `https://res.cloudinary.com/dym0se5if/video/upload/edutech/lessons/${slug}.mp4`,
            fileSize: 120_000_000,
          },
        };
      }),
    })),
  }));
