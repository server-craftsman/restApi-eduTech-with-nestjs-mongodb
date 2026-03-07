import { Injectable } from '@nestjs/common';
import { CourseService } from '../courses/course.service';
import { LessonService } from '../lessons/lesson.service';
import { LessonProgressService } from '../lesson-progress/lesson-progress.service';
import { QuizAttemptService } from '../quiz-attempts/quiz-attempt.service';
import { QuestionService } from '../questions/question.service';
import { GradeLevel } from '../enums';
import { LessonProgress } from '../lesson-progress/domain/lesson-progress';

export interface LearningPathNode {
  id: string;
  title: string;
  type: 'subject' | 'chapter' | 'lesson';
  status: 'locked' | 'in-progress' | 'completed';
  progress: number;
  children?: LearningPathNode[];
  prerequisiteCompleted?: boolean;
  videoUrl?: string;
  hasQuiz?: boolean;
}

export interface LessonUnlockResult {
  success: boolean;
  message: string;
  nextLessonId?: string;
}

@Injectable()
export class LearningPathService {
  constructor(
    private readonly courseService: CourseService,
    private readonly lessonService: LessonService,
    private readonly lessonProgressService: LessonProgressService,
    private readonly quizAttemptService: QuizAttemptService,
    private readonly questionService: QuestionService,
  ) {}

  async getLearningPath(
    userId: string,
    gradeLevel: GradeLevel,
  ): Promise<LearningPathNode[]> {
    // Lấy tất cả courses theo grade level
    const courses = await this.courseService.findByGradeLevel(gradeLevel);
    const path: LearningPathNode[] = [];

    for (const course of courses) {
      // Lấy chapters của course
      const chapters = (await this.courseService.getChaptersWithLessons(
        course.id,
      )) as Array<{ id: string; title: string }>;
      const courseProgress = await this.calculateCourseProgress(
        userId,
        course.id,
      );

      const courseNode: LearningPathNode = {
        id: course.id,
        title: course.title,
        type: 'subject',
        status:
          courseProgress === 100
            ? 'completed'
            : courseProgress > 0
              ? 'in-progress'
              : 'locked',
        progress: courseProgress,
        children: [],
      };

      for (const chapter of chapters) {
        const chapterProgress = await this.calculateChapterProgress(
          userId,
          chapter.id,
        );
        const chapterNode: LearningPathNode = {
          id: chapter.id,
          title: chapter.title,
          type: 'chapter',
          status:
            chapterProgress === 100
              ? 'completed'
              : chapterProgress > 0
                ? 'in-progress'
                : 'locked',
          progress: chapterProgress,
          children: [],
        };

        // Lấy lessons của chapter theo thứ tự
        const lessons = await this.lessonService.findByChapterIdOrdered(
          chapter.id,
        );

        for (let i = 0; i < lessons.length; i++) {
          const lesson = lessons[i];
          const lessonProgress =
            await this.lessonProgressService.findByUserAndLesson(
              userId,
              lesson.id,
            );
          const prerequisiteCompleted = await this.checkLessonPrerequisite(
            userId,
            lesson.id,
            i,
          );

          const lessonNode: LearningPathNode = {
            id: lesson.id,
            title: lesson.title,
            type: 'lesson',
            status: this.getLessonStatus(lessonProgress, prerequisiteCompleted),
            progress: lessonProgress?.progressPercent || 0,
            prerequisiteCompleted,
            videoUrl: lesson.video.url,
          };

          chapterNode.children!.push(lessonNode);
        }

        courseNode.children!.push(chapterNode);
      }

      path.push(courseNode);
    }

    return path;
  }

  async checkLessonUnlock(
    userId: string,
    lessonId: string,
  ): Promise<LessonUnlockResult> {
    const lesson = await this.lessonService.findById(lessonId);
    if (!lesson) {
      return { success: false, message: 'Bài học không tồn tại' };
    }

    // Kiểm tra bài học trước đó
    const previousLesson =
      await this.lessonService.findPreviousLesson(lessonId);
    if (!previousLesson) {
      // Đây là bài đầu tiên, luôn được mở
      return { success: true, message: 'Bài học đã được mở khóa' };
    }

    // Kiểm tra điều kiện mở khóa: video xem xong + quiz > 80%
    const videoCompleted = await this.checkVideoCompleted(
      userId,
      previousLesson.id,
    );
    const hasQuestions = await this.lessonHasQuestions(previousLesson.id);
    const quizPassed = hasQuestions
      ? await this.checkQuizPassed(userId, previousLesson.id, 80)
      : true; // If no quiz, consider it passed

    if (!videoCompleted) {
      return {
        success: false,
        message: 'Bạn cần xem xong video bài trước để mở khóa bài này',
      };
    }

    if (!quizPassed) {
      return {
        success: false,
        message:
          'Bạn cần đạt điểm > 80% trong bài tập trước để mở khóa bài này',
      };
    }

    return {
      success: true,
      message: 'Bài học đã được mở khóa',
      nextLessonId: lessonId,
    };
  }

  private async calculateCourseProgress(
    userId: string,
    courseId: string,
  ): Promise<number> {
    // Tính tổng progress của tất cả lessons trong course
    const lessons = await this.lessonService.findByCourseId(courseId);
    if (lessons.length === 0) return 0;

    let totalProgress = 0;
    for (const lesson of lessons) {
      const progress = await this.lessonProgressService.findByUserAndLesson(
        userId,
        lesson.id,
      );
      totalProgress += progress?.progressPercent || 0;
    }

    return Math.round(totalProgress / lessons.length);
  }

  private async calculateChapterProgress(
    userId: string,
    chapterId: string,
  ): Promise<number> {
    const lessons = await this.lessonService.findByChapterId(chapterId);
    if (lessons.length === 0) return 0;

    let totalProgress = 0;
    for (const lesson of lessons) {
      const progress = await this.lessonProgressService.findByUserAndLesson(
        userId,
        lesson.id,
      );
      totalProgress += progress?.progressPercent || 0;
    }

    return Math.round(totalProgress / lessons.length);
  }

  private async checkLessonPrerequisite(
    userId: string,
    lessonId: string,
    lessonIndex: number,
  ): Promise<boolean> {
    if (lessonIndex === 0) return true; // Bài đầu tiên luôn được mở

    const previousLesson =
      await this.lessonService.findPreviousLesson(lessonId);
    if (!previousLesson) return true;

    const videoCompleted = await this.checkVideoCompleted(
      userId,
      previousLesson.id,
    );
    const hasQuestions = await this.lessonHasQuestions(previousLesson.id);
    const quizPassed = hasQuestions
      ? await this.checkQuizPassed(userId, previousLesson.id, 80)
      : true; // If no quiz, consider it passed

    return videoCompleted && quizPassed;
  }

  private getLessonStatus(
    lessonProgress: LessonProgress | null,
    prerequisiteCompleted: boolean,
  ): 'locked' | 'in-progress' | 'completed' {
    if (!prerequisiteCompleted) return 'locked';
    if (!lessonProgress) return 'locked';
    if (lessonProgress.progressPercent === 100) return 'completed';
    if (lessonProgress.progressPercent > 0) return 'in-progress';
    return 'locked';
  }

  private async checkVideoCompleted(
    userId: string,
    lessonId: string,
  ): Promise<boolean> {
    const progress = await this.lessonProgressService.findByUserAndLesson(
      userId,
      lessonId,
    );
    return progress?.videoWatched || false;
  }

  private async checkQuizPassed(
    userId: string,
    lessonId: string,
    passingScore: number,
  ): Promise<boolean> {
    const bestAttempt = await this.quizAttemptService.getBestAttempt(
      userId,
      lessonId,
    );
    return (bestAttempt?.score || 0) >= passingScore;
  }

  private async lessonHasQuestions(lessonId: string): Promise<boolean> {
    const questions = await this.questionService.findByLessonId(lessonId);
    return questions.length > 0;
  }
}
