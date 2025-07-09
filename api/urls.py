from django.urls import path
from .views import (
    VoteListCreateView,
    VoteDetailView,
    FeedbackListCreateView,
    FeedbackDetailView,
    SectorVotesView,
    TotalVotesView
)

urlpatterns = [
    path('votes/', VoteListCreateView.as_view(), name='vote-list-create'),
    path('votes/<int:pk>/', VoteDetailView.as_view(), name='vote-detail'),
    path('feedback/', FeedbackListCreateView.as_view(), name='feedback-list-create'),
    path('feedback/<int:pk>/', FeedbackDetailView.as_view(), name='feedback-detail'),
    path('sector-votes/', SectorVotesView.as_view(), name='sector-votes'),
    path('total-votes/', TotalVotesView.as_view(), name='total-votes'),
] 