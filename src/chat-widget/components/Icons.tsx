/**
 * Centralized icon exports to optimize bundle size
 * All lucide-react icons are imported here and re-exported
 * This allows for better tree-shaking and reduces duplication
 */

export {
  // ChatWindow icons
  X,
  ShieldCheck,
  Heart,
  
  // InputArea icons
  Paperclip,
  Send,
  Loader2,
  Image as ImageIcon,
  FileAudio,
  FileText,
  FileIcon,
  Plus,
  MapPin,
  Mic,
  Trash2,
  
  // AudioPlayer icons
  Play,
  Pause,
  
  // Launcher icons
  MessageCircle,
  
  // Gallery icons
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  
  // MessageBubble icons
  CheckCheck,
  MapPin as MapPinBubble,
  ExternalLink,
  ArrowRight,
  Download,
} from 'lucide-react'
