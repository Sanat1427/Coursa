import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Course } from '@/type/CourseType'
import { Button } from '@/components/ui/button'
import { Calendar, Layers, Play, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import moment from 'moment';
import axios from 'axios'
import { toast } from 'sonner'

type Props = {
    courseItem: Course;
    onDeleted?: () => void;
}

function CourseListCard({ courseItem, onDeleted }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating to the course page
        e.stopPropagation();

        if (!confirm("Are you sure you want to delete this sketched course? This cannot be undone.")) {
            return;
        }

        setIsDeleting(true);
        const toastId = toast.loading("Erasing sketch...");
        try {
            await axios.delete(`/api/course?courseId=${courseItem.courseId}`);
            toast.success("Sketch deleted styling successfully!", { id: toastId });
            if (onDeleted) onDeleted();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete the sketch.", { id: toastId });
            setIsDeleting(false);
        }
    };

    return (
        <div className="relative pt-2 transition-all hover:scale-105 hover:z-20 group">
            {/* Delete Button */}
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="absolute -top-2 -right-2 z-30 p-2 bg-red-100 text-red-600 rounded-full wobbly-border hard-shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                title="Delete Course"
            >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            </button>

            {/* Thumbtack Decoration */}
            <div className="thumbtack absolute top-0 right-1/2 translate-x-1/2 z-20 pointer-events-none"></div>

            <Card className='bg-white wobbly-border hard-shadow-sm border-none shadow-none z-10 hover:shadow-lg relative overflow-visible'>
                <CardHeader className="pb-4">
                    <div className='flex justify-between items-start gap-4 mb-2'>
                        <h2 className='font-display text-xl font-bold leading-tight line-clamp-2 pr-4'>
                            {courseItem?.courseName}
                        </h2>
                        <h2 className='text-sketch-primary text-sm bg-purple-50 p-1 px-3 wobbly-border border-2 font-display uppercase tracking-wider shrink-0'>
                            {courseItem?.courseLayout?.level}
                        </h2>
                    </div>
                    <div className='flex flex-wrap gap-4 items-center'>
                        <h2 className='flex items-center gap-2 text-slate-600 text-xs font-sans'>
                            <Layers className='h-4 w-4 text-sketch-blue' />
                            {courseItem?.courseLayout?.totalChapters} Chapters
                        </h2>
                        <h2 className='flex items-center gap-2 text-slate-600 text-xs font-sans'>
                            <Calendar className='h-4 w-4 text-sketch-orange' />
                            {moment(courseItem?.createdAt).format('MMM DD')}
                        </h2>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className='flex justify-between items-center border-t border-dashed border-slate-200 pt-4'>
                        <p className="font-display italic text-slate-400">Sketch Ready</p>
                        <Link href={`/course/${courseItem?.courseId}`}>
                            <button className="bg-black text-white px-5 py-2 wobbly-border hard-shadow-sm hover:translate-x-0.5 font-display text-lg hover:translate-y-0.5 transition-all flex items-center gap-2">
                                Watch <Play className="w-4 h-4 fill-white" />
                            </button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default CourseListCard